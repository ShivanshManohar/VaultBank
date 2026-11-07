using System.Net.Http.Headers;
using System.Text;
using System.Text.Json;
using VaultBank.Api.Models.DTOs;

namespace VaultBank.Api.Services;

public class VaultAiService
{
    private readonly FinancialIntelligenceService _intelligenceService;
    private readonly BankingService _bankingService;
    private readonly FixedDepositService _fdService;
    private readonly GoalService _goalService;
    private readonly IConfiguration _config;
    private readonly ILogger<VaultAiService> _logger;
    private readonly HttpClient _httpClient;

    public VaultAiService(
        FinancialIntelligenceService intelligenceService,
        BankingService bankingService,
        FixedDepositService fdService,
        GoalService goalService,
        IConfiguration config,
        ILogger<VaultAiService> logger,
        IHttpClientFactory httpClientFactory)
    {
        _intelligenceService = intelligenceService;
        _bankingService = bankingService;
        _fdService = fdService;
        _goalService = goalService;
        _config = config;
        _logger = logger;
        _httpClient = httpClientFactory.CreateClient("GeminiClient");
    }

    public async Task<AiChatResponse> ProcessChatAsync(Guid customerId, AiChatRequest request)
    {
        // 1. Gather authenticated customer context safely (read-only tools)
        var overview = await _intelligenceService.GetOverviewAsync(customerId);
        var pulse = await _intelligenceService.GetMonthlyPulseAsync(customerId);
        var fds = await _fdService.GetCustomerFDsAsync(customerId);
        var goals = await _goalService.GetGoalsAsync(customerId);

        // Sanitize context: masked account identifiers, aggregated figures
        var contextSummary = new
        {
            TotalSavings = overview.TotalSavingsBalance,
            AvailableBalance = overview.TotalAvailableBalance,
            TotalEarmarkedForGoals = overview.TotalEarmarkedGoals,
            ActiveFDCount = overview.ActiveFDsCount,
            TotalFDPrincipal = overview.TotalActiveFDPrincipal,
            ProjectedFDMaturity = overview.TotalProjectedFDMaturity,
            NextMaturityDate = overview.NextMaturityDate?.ToString("yyyy-MM-dd"),
            NextMaturityPayout = overview.NextMaturityPayout,
            MonthlySavingsRate = $"{pulse.SavingsRatePercentage}%",
            ActiveGoals = goals.Select(g => new { g.Title, g.TargetAmount, g.AllocatedAmount, g.ProgressPercentage }),
            ActiveFDs = fds.Where(f => f.Status == "Active").Select(f => new
            {
                f.FDNumber,
                f.PrincipalAmount,
                f.InterestRate,
                f.MaturityDate,
                f.ExpectedMaturityAmount
            })
        };

        string sanitizedContextJson = JsonSerializer.Serialize(contextSummary);

        // 2. Intent & Navigation Detection (Deterministic & LLM guided)
        var (navRoute, navLabel) = DetectNavigationIntent(request.Prompt);

        // 3. Attempt Gemini API Call if configured
        string? apiKey = _config["GEMINI_API_KEY"] ?? Environment.GetEnvironmentVariable("GEMINI_API_KEY");
        string modelName = _config["GEMINI_MODEL"] ?? Environment.GetEnvironmentVariable("GEMINI_MODEL") ?? "gemini-2.5-flash-lite";

        if (!string.IsNullOrWhiteSpace(apiKey) && apiKey != "your-gemini-api-key-here")
        {
            try
            {
                string geminiReply = await CallGeminiAsync(apiKey, modelName, request.Prompt, sanitizedContextJson, request.ActiveRoute, request.History);
                if (!string.IsNullOrWhiteSpace(geminiReply))
                {
                    return new AiChatResponse
                    {
                        Reply = geminiReply,
                        SuggestedNavigationRoute = navRoute,
                        SuggestedActionLabel = navLabel,
                        FollowUpSuggestions = GenerateFollowUps(request.Prompt, overview),
                        ModelUsed = modelName,
                        Timestamp = DateTime.UtcNow
                    };
                }
            }
            catch (Exception ex)
            {
                _logger.LogWarning(ex, "Gemini API call failed or timed out. Falling back to deterministic wealth intelligence engine.");
            }
        }

        // 4. Deterministic Intelligent Fallback
        string fallbackReply = GenerateDeterministicReply(request.Prompt, contextSummary, pulse);

        return new AiChatResponse
        {
            Reply = fallbackReply,
            SuggestedNavigationRoute = navRoute,
            SuggestedActionLabel = navLabel,
            FollowUpSuggestions = GenerateFollowUps(request.Prompt, overview),
            ModelUsed = "vault-intelligence-engine (offline)",
            Timestamp = DateTime.UtcNow
        };
    }

    private async Task<string> CallGeminiAsync(string apiKey, string model, string prompt, string contextJson, string route, List<ConversationTurn> history)
    {
        string endpoint = $"https://generativelanguage.googleapis.com/v1beta/models/{model}:generateContent?key={apiKey}";

        string systemInstruction =
            "You are VAULT AI, the ultra-premium personal wealth intelligence co-pilot for VaultBank. " +
            "Brand personality: Understated luxury, precise, intelligent, trustworthy, concise. " +
            "Strict Guidelines:\n" +
            "1. You have read-only access to the customer's authenticated portfolio context provided below.\n" +
            "2. Never invent balances, maturity amounts, or interest figures. Use ONLY the provided context.\n" +
            "3. You CANNOT execute financial transactions (deposits, withdrawals, opening/breaking FDs). Direct user to the UI.\n" +
            "4. Never output passwords, auth tokens, or private details.\n" +
            "5. Keep responses concise — 3 to 6 sentences unless a detailed breakdown is explicitly requested.\n" +
            $"Current Page: {route}\n" +
            $"Portfolio Context (JSON): {contextJson}";

        // Build multi-turn contents array: system context in first user turn, then alternating history, then current query
        var contents = new List<object>();

        // First turn always contains system context + first query OR just system context if there's history
        if (history == null || history.Count == 0)
        {
            // Single turn: system + current query
            contents.Add(new
            {
                role = "user",
                parts = new[] { new { text = $"{systemInstruction}\n\nCustomer Query: {prompt}" } }
            });
        }
        else
        {
            // Multi-turn: embed system in first user message of history, then alternate, then current
            bool systemEmbedded = false;
            foreach (var turn in history)
            {
                if (!systemEmbedded && turn.Role == "user")
                {
                    contents.Add(new
                    {
                        role = "user",
                        parts = new[] { new { text = $"{systemInstruction}\n\nCustomer Query: {turn.Content}" } }
                    });
                    systemEmbedded = true;
                }
                else
                {
                    contents.Add(new
                    {
                        role = turn.Role == "model" ? "model" : "user",
                        parts = new[] { new { text = turn.Content } }
                    });
                }
            }
            // If history started with model (shouldn't happen but guard):
            if (!systemEmbedded)
            {
                contents.Insert(0, new
                {
                    role = "user",
                    parts = new[] { new { text = $"{systemInstruction}\n\nCustomer Query: {prompt}" } }
                });
            }
            else
            {
                // Append current query as final user turn
                contents.Add(new
                {
                    role = "user",
                    parts = new[] { new { text = prompt } }
                });
            }
        }

        var payload = new
        {
            contents,
            generationConfig = new
            {
                temperature = 0.2,
                maxOutputTokens = 600
            }
        };

        var requestMessage = new HttpRequestMessage(HttpMethod.Post, endpoint)
        {
            Content = new StringContent(JsonSerializer.Serialize(payload), Encoding.UTF8, "application/json")
        };

        var response = await _httpClient.SendAsync(requestMessage);
        if (!response.IsSuccessStatusCode)
        {
            _logger.LogWarning("Gemini API returned status code {StatusCode}", response.StatusCode);
            return string.Empty;
        }

        string responseJson = await response.Content.ReadAsStringAsync();
        using var doc = JsonDocument.Parse(responseJson);

        var candidates = doc.RootElement.GetProperty("candidates");
        if (candidates.GetArrayLength() > 0)
        {
            var content = candidates[0].GetProperty("content");
            var parts = content.GetProperty("parts");
            if (parts.GetArrayLength() > 0)
            {
                return parts[0].GetProperty("text").GetString() ?? string.Empty;
            }
        }

        return string.Empty;
    }

    private static (string? Route, string? Label) DetectNavigationIntent(string prompt)
    {
        string lower = prompt.ToLowerInvariant();
        if (lower.Contains("fd") || lower.Contains("fixed deposit") || lower.Contains("term deposit") || lower.Contains("portfolio"))
            return ("/fixed-deposits", "Open FD Portfolio");
        if (lower.Contains("simulator") || lower.Contains("growth") || lower.Contains("compound") || lower.Contains("what-if") || lower.Contains("ladder"))
            return ("/simulator", "Launch Growth Simulator");
        if (lower.Contains("goal") || lower.Contains("target") || lower.Contains("emergency"))
            return ("/goals", "View Savings Goals");
        if (lower.Contains("account") || lower.Contains("transaction") || lower.Contains("deposit") || lower.Contains("withdraw"))
            return ("/accounts", "View Savings Accounts");
        if (lower.Contains("intelligence") || lower.Contains("pulse") || lower.Contains("journal") || lower.Contains("spending"))
            return ("/intelligence", "Open Intelligence Hub");

        return (null, null);
    }

    private static string GenerateDeterministicReply(string prompt, dynamic ctx, MonthlyPulseResponse pulse)
    {
        string lower = prompt.ToLowerInvariant();

        if (lower.Contains("interest") || lower.Contains("earn"))
        {
            return $"Your active fixed deposits have currently accrued ₹{ctx.TotalAccruedInterest:N2} in interest. " +
                   $"Across all active contracts, you are projected to receive ₹{ctx.ProjectedFDMaturity:N2} upon maturity, representing a significant return above your ₹{ctx.TotalFDPrincipal:N2} locked principal.";
        }

        if (lower.Contains("mature") || lower.Contains("maturity") || lower.Contains("next"))
        {
            if (ctx.NextMaturityDate != null)
            {
                return $"Your next term deposit matures on **{ctx.NextMaturityDate}** with a projected payout of **₹{ctx.NextMaturityPayout:N2}**. " +
                       "Upon maturity, the principal and compounded proceeds will be automatically credited to your linked reserve account.";
            }
            return "You do not have any currently active fixed deposits approaching maturity.";
        }

        if (lower.Contains("goal") || lower.Contains("earmark") || lower.Contains("emergency"))
        {
            return $"You currently have ₹{ctx.TotalEarmarkedForGoals:N2} virtually earmarked across your savings goals. " +
                   $"Remember that virtual goal earmarks protect your savings by reducing your Available Balance (currently ₹{ctx.AvailableBalance:N2}) while keeping your Total Balance intact at ₹{ctx.TotalSavings:N2}.";
        }

        if (lower.Contains("ladder") || lower.Contains("laddering"))
        {
            return "Fixed Deposit Laddering divides a lump-sum into multiple deposits maturing at staggered intervals (e.g. 1, 2, 3, and 5 years). " +
                   "This strategy balances high long-term yields with regular liquidity as each tranche matures. You can simulate this in the **FD Ladder Builder** under Wealth Growth.";
        }

        if (lower.Contains("penalty") || lower.Contains("early") || lower.Contains("premature"))
        {
            return "Premature liquidation is permitted under bank policy subject to a 1.00% penalty deduction from the contract rate for the elapsed duration. " +
                   "You can preview your exact net payout and penalty deduction directly from your FD Portfolio before confirming.";
        }

        return $"You currently have **₹{ctx.TotalSavings:N2}** in liquid savings (with **₹{ctx.AvailableBalance:N2}** unallocated) and **₹{ctx.TotalFDPrincipal:N2}** invested across **{ctx.ActiveFDCount}** active fixed deposits. " +
               $"{pulse.EditorialNarrative}";
    }

    private static List<string> GenerateFollowUps(string prompt, FinancialOverviewResponse overview)
    {
        string lower = prompt.ToLowerInvariant();

        if (lower.Contains("interest") || lower.Contains("earn") || lower.Contains("compound"))
            return new List<string>
            {
                "Which of my fixed deposits matures first?",
                "How does quarterly compounding compare with annual?",
                "Show me the FD ladder strategy",
                "What is my projected total payout?"
            };

        if (lower.Contains("mature") || lower.Contains("maturity") || lower.Contains("payout"))
            return new List<string>
            {
                "Can I add this date to my Google Calendar?",
                "What penalty applies if I break an FD early?",
                "How much interest will I earn in total?",
                "Simulate a new 3-year fixed deposit"
            };

        if (lower.Contains("goal") || lower.Contains("earmark") || lower.Contains("emergency"))
            return new List<string>
            {
                "How much is unallocated in my savings accounts?",
                "How do I create a new savings goal?",
                "What is my total net worth?",
                "Open FD portfolio"
            };

        if (lower.Contains("ladder") || lower.Contains("laddering"))
            return new List<string>
            {
                "Simulate ₹1,00,000 across 4 tranches",
                "What rates does VaultBank offer?",
                "Which FD matures first?",
                "Open the Ladder Builder"
            };

        if (lower.Contains("penalty") || lower.Contains("premature") || lower.Contains("break") || lower.Contains("early"))
            return new List<string>
            {
                "Show my FD portfolio",
                "What is my projected maturity payout?",
                "How does interest accrual work?",
                "Simulate a replacement deposit"
            };

        if (lower.Contains("spending") || lower.Contains("pulse") || lower.Contains("savings rate"))
            return new List<string>
            {
                "How much is unallocated right now?",
                "Open Fixed Deposits Portfolio",
                "What is my savings rate this month?",
                "Show my wealth journal"
            };

        // Default follow-ups adapted to portfolio state
        var followUps = new List<string>
        {
            "Which of my fixed deposits matures first?",
            "How does quarterly compounding work?",
        };

        if (overview.ActiveGoalsCount > 0)
            followUps.Add("How much is earmarked for my goals?");
        else
            followUps.Add("How do I create a savings goal?");

        followUps.Add("Explain the FD laddering strategy");
        return followUps;
    }
}
