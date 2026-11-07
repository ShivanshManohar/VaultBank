using System.Text;
using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.EntityFrameworkCore;
using Microsoft.IdentityModel.Tokens;
using Microsoft.OpenApi.Models;
using VaultBank.Api.BackgroundJobs;
using VaultBank.Api.Common;
using VaultBank.Api.Data;
using VaultBank.Api.Services;

var builder = WebApplication.CreateBuilder(args);

// 1. Controller & JSON Configuration
builder.Services.AddControllers()
    .AddJsonOptions(options =>
    {
        options.JsonSerializerOptions.PropertyNamingPolicy = System.Text.Json.JsonNamingPolicy.CamelCase;
    });

// 2. CORS Configuration
builder.Services.AddCors(options =>
{
    options.AddPolicy("AllowFrontend", policy =>
    {
        policy.WithOrigins(
            "http://localhost:5173",
            "http://127.0.0.1:5173",
            "http://localhost:3000")
              .AllowAnyHeader()
              .AllowAnyMethod()
              .AllowCredentials();
    });
});

// 3. Database Context (Dual-Provider: SQL Server & SQLite)
string dbProvider = builder.Configuration["DatabaseProvider"] ?? "Sqlite";
string connectionString = builder.Configuration.GetConnectionString("VaultBankDb") ?? "Data Source=vaultbank.db";

builder.Services.AddDbContext<VaultBankDbContext>(options =>
{
    if (dbProvider.Equals("SqlServer", StringComparison.OrdinalIgnoreCase))
    {
        options.UseSqlServer(connectionString);
    }
    else
    {
        options.UseSqlite(connectionString);
    }
});

// 4. JWT Authentication & Authorization
var jwtSecret = builder.Configuration["JWT:Key"] ?? "VaultBank_UltraSecure_SuperSecretMasterKey_2026!_ChampagneGoldObsidian";
var key = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(jwtSecret));

builder.Services.AddAuthentication(JwtBearerDefaults.AuthenticationScheme)
    .AddJwtBearer(options =>
    {
        options.TokenValidationParameters = new TokenValidationParameters
        {
            ValidateIssuer = true,
            ValidateAudience = true,
            ValidateLifetime = true,
            ValidateIssuerSigningKey = true,
            ValidIssuer = builder.Configuration["JWT:Issuer"] ?? "VaultBank",
            ValidAudience = builder.Configuration["JWT:Audience"] ?? "VaultBankClients",
            IssuerSigningKey = key
        };
    });

builder.Services.AddAuthorization(options =>
{
    options.AddPolicy("AdminOnly", policy => policy.RequireRole("Admin"));
    options.AddPolicy("CustomerOnly", policy => policy.RequireRole("Customer"));
});

// 5. Dependency Injection for Business Services
builder.Services.AddScoped<BankingService>();
builder.Services.AddScoped<FixedDepositService>();
builder.Services.AddScoped<GoalService>();
builder.Services.AddScoped<SimulationService>();
builder.Services.AddScoped<FinancialIntelligenceService>();
builder.Services.AddScoped<VaultAiService>();
builder.Services.AddScoped<ExternalFinancialDataService>();

// 6. Background Automation Worker
builder.Services.AddHostedService<InterestAccrualBackgroundService>();

// 7. HTTP Client Factory for Gemini
builder.Services.AddHttpClient("GeminiClient", client =>
{
    client.Timeout = TimeSpan.FromSeconds(15);
});

// 8. Swagger Documentation with JWT Bearer Support
builder.Services.AddEndpointsApiExplorer();
builder.Services.AddSwaggerGen(c =>
{
    c.SwaggerDoc("v1", new OpenApiInfo
    {
        Title = "VaultBank API",
        Version = "v1",
        Description = "API for VaultBank — AI-Powered Digital Banking & Personal Wealth Intelligence Platform"
    });

    c.AddSecurityDefinition("Bearer", new OpenApiSecurityScheme
    {
        Name = "Authorization",
        Type = SecuritySchemeType.Http,
        Scheme = "Bearer",
        BearerFormat = "JWT",
        In = ParameterLocation.Header,
        Description = "Enter JWT Bearer token"
    });

    c.AddSecurityRequirement(new OpenApiSecurityRequirement
    {
        {
            new OpenApiSecurityScheme
            {
                Reference = new OpenApiReference
                {
                    Type = ReferenceType.SecurityScheme,
                    Id = "Bearer"
                }
            },
            Array.Empty<string>()
        }
    });
});

var app = builder.Build();

// 9. Automatic Database Migration & Seeding
using (var scope = app.Services.CreateScope())
{
    var context = scope.ServiceProvider.GetRequiredService<VaultBankDbContext>();
    await context.Database.EnsureCreatedAsync();
    await DbInitializer.SeedAsync(context);
}

// 10. HTTP Pipeline
app.UseMiddleware<GlobalExceptionMiddleware>();

if (app.Environment.IsDevelopment())
{
    app.UseSwagger();
    app.UseSwaggerUI();
}

app.UseCors("AllowFrontend");

app.UseAuthentication();
app.UseAuthorization();

app.MapControllers();

app.Run();
