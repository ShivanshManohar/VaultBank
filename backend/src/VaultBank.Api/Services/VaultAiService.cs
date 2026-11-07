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
                string geminiReply = await CallGeminiAsync(apiKey, modelName, request.Prompt, sanitizedContextJson, request.ActiveRoute);
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
            ModelUsed = "gemini-2.5-flash-lite (offline fallback)",
            Timestamp = DateTime.UtcNow
        };
    }

    private async Task<string> CallGeminiAsync(string apiKey, string model, string prompt, string contextJson, string route)
    {
        string endpoint = $"https://generativelanguage.googleapis.com/v1beta/models/{model}:generateContent?key={apiKey}";

        string systemInstruction =
            "You are VAULT AI, the ultra-premium personal wealth intelligence co-pilot for VaultBank. " +
            "Brand personality: Understated luxury, precise, intelligent, trustworthy, concise. " +
            "Strict Guidelines:\n" +
            "1. You have read-only access to the customer's authenticated portfolio context provided below.\n" +
            "2. Never invent balances, maturity amounts, or interest figures. Use the provided context.\n" +
            "3. You CANNOT execute financial transactions (deposits, withdrawals, opening/breaking FDs). Direct user to confirmed UI workflows.\n" +
            "4. Never output passwords, auth tokens, or private details.\n" +
            $"Current Page Context: {route}\n" +
            $"Authenticated Portfolio Context (JSON): {contextJson}";

        var payload = new
        {
            contents = new[]
            {
                new
                {
                    role = "user",
                    parts = new[]
                    {
                        new { text = $"{systemInstruction}\n\nCustomer Query: {prompt}" }
                    }
                }
            },
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
        return new List<string>
        {
            "Which of my fixed deposits matures first?",
            "How does quarterly compounding compare with annual?",
            "How much is unallocated in my savings accounts?",
            "Explain the FD laddering strategy"
        };
    }
}
