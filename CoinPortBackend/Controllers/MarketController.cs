using Microsoft.AspNetCore.Mvc;
using Newtonsoft.Json.Linq;

namespace CoinPortBackend.Controllers
{
    [Route("/market")]
    [ApiController]
    public class MarketController : ControllerBase
    {
        private readonly HttpClient _httpClient; // Dependency injection för att göra HTTP-anrop
        private readonly string _apiKey;

        public MarketController(HttpClient httpClient, IConfiguration configuration)
        {
            _httpClient = httpClient; // Spara instansen i ett fält för att göra HTTP-anrop
            _apiKey = configuration["CoinGeckoApiKey"]; // Hämta API-nyckeln från appsettings.json

            // TODO: Lägg till validering för att säkerställa att _apiKey inte är null eller tom
        }

        // Hämta de 250 största kryptovalutorna från CoinGecko
        [HttpGet]
        public async Task<IActionResult> GetAllCoinsFromCoingecko()
        {
            // Kontrollera om headern redan finns, annars lägg till den
            if (!_httpClient.DefaultRequestHeaders.Contains("x-cg-demo-api-key"))
            {
                _httpClient.DefaultRequestHeaders.Add("x-cg-demo-api-key", _apiKey);
            }

            // Gör ett GET-anrop till CoinGecko API
            var response = await _httpClient.GetStringAsync("https://api.coingecko.com/api/v3/coins/markets?vs_currency=usd&order=market_cap_desc&per_page=250&page=1&sparkline=false");

            Console.WriteLine(response);

            // Parsa JSON-svaret och skapa en lista med objekt. JArray är en del av Newtonsoft.Json som används för att hantera JSON
            var coins = JArray.Parse(response).Select(c => new
            {
                CoinId = c["id"]?.ToString() ?? "N/A",
                Name = c["name"]?.ToString() ?? "Unknown",
                Ticker = c["symbol"]?.ToString().ToUpper() ?? "N/A",
                Price = c["current_price"]?.Value<decimal>() ?? 0m,
                PriceChange24hPercent = c["price_change_percentage_24h"] != null && decimal.TryParse(c["price_change_percentage_24h"]?.ToString(), out var percentChange)
                    ? Math.Round(percentChange, 2)
                    : 0m,
                PriceChange24h = c["price_change_24h"] != null && decimal.TryParse(c["price_change_24h"]?.ToString(), out var priceChange)
                    ? priceChange
                    : 0m,
                MarketCap = c["market_cap"]?.Value<decimal>() ?? 0m
            });

            return Ok(coins); // Returnera en lista med coins
        }
    }
}
