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

        // Hämta de 2000 största coinsen från coingecko
        [HttpGet]
        public async Task<IActionResult> GetAllCoinsFromCoingecko()
        {
            // Kontrollera om headern redan finns, annars lägg till den
            if (!_httpClient.DefaultRequestHeaders.Contains("x-cg-demo-api-key"))
            {
                _httpClient.DefaultRequestHeaders.Add("x-cg-demo-api-key", _apiKey);
            }

            var allCoins = new List<object>();
            int totalCoinsToFetch = 2000;
            int coinsPerPage = 250;
            int totalPages = (int)Math.Ceiling((double)totalCoinsToFetch / coinsPerPage);

            for (int page = 1; page <= totalPages; page++)
            {
                // Bygg URL för varje sida
                var url = $"https://api.coingecko.com/api/v3/coins/markets?vs_currency=usd&order=market_cap_desc&per_page={coinsPerPage}&page={page}&sparkline=false";

                // Hämta data från API:et
                var response = await _httpClient.GetStringAsync(url);

                // Parsa JSON-svaret och lägg till varje coin till listan
                var coins = JArray.Parse(response).Select(c => new
                {
                    CoinId = c["id"]?.ToString() ?? "N/A",
                    Rank = c["market_cap_rank"]?.Value<int>() ?? 0,
                    Image = c["image"]?.ToString() ?? "N/A",
                    Name = c["name"]?.ToString() ?? "Unknown",
                    Ticker = c["symbol"]?.ToString().ToUpper() ?? "N/A",
                    Price = c["current_price"]?.Value<decimal>() ?? 0m,
                    PriceChange24hPercent = c["price_change_percentage_24h"] != null && decimal.TryParse(c["price_change_percentage_24h"]?.ToString(), out var percentChange)
                        ? Math.Round(percentChange, 2)
                        : 0m,
                    PriceChange24h = c["price_change_24h"]?.Type == JTokenType.Float || c["price_change_24h"]?.Type == JTokenType.Integer
                        ? c["price_change_24h"].Value<decimal>()
                        : 0m,
                    MarketCap = c["market_cap"]?.Value<decimal>() ?? 0m
                });

                allCoins.AddRange(coins);
            }

            return Ok(allCoins); // Returnera alla coins i en sammanfattad lista
        }

    }
}
