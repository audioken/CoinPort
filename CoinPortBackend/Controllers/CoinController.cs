using CoinPortBackend.Data;
using CoinPortBackend.Models;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Newtonsoft.Json.Linq;

namespace CoinPortBackend.Controllers
{
    [Route("/coins")]
    [ApiController]
    public class CoinController : ControllerBase
    {
        private readonly AppDbContext _context; // Dependency injection för att komma åt databasen
        private readonly HttpClient _httpClient; // Dependency injection för att göra HTTP-anrop
        private readonly string _apiKey;

        public CoinController(AppDbContext context, HttpClient httpClient, IConfiguration configuration)
        {
            _context = context; // Spara instansen i ett fält för att komma åt databasen
            _httpClient = httpClient; // Spara instansen i ett fält för att göra HTTP-anrop
            _apiKey = configuration["CoinGeckoApiKey"]; // Hämta API-nyckeln från appsettings.json

            // TODO: Lägg till validering för att säkerställa att _apiKey inte är null eller tom
        }

        /// API ENDPOINTS ///
        // Hämta och visa alla coins som är sparade i portfolion
        [HttpGet("portfolio")]
        public IActionResult GetAllPortfolioCoins()
        {
            return Ok(_context.Coins.ToList());
        }

        // Hämta ett specifikt coin från portfolion baserat på coinId (sträng)
        [HttpGet("portfolio/{coinId}")]
        public IActionResult GetCoinFromPortfolio(string coinId)
        {
            var coin = _context.Coins.FirstOrDefault(c => c.CoinId == coinId);

            if (coin == null)
            {
                return NotFound();
            }

            return Ok(coin);
        }

        // Hämta de 20 största kryptovalutorna från CoinGecko
        [HttpGet("coingecko/current-market")]
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
                Change24hPercent = c["price_change_percentage_24h"] != null && decimal.TryParse(c["price_change_percentage_24h"]?.ToString(), out var percentChange)
                    ? Math.Round(percentChange, 2)
                    : 0m,
                MarketCap = c["market_cap"]?.Value<decimal>() ?? 0m
            });

            return Ok(coins); // Returnera en lista med coins
        }

        // Lägg till en coin i portfolio från CoinGecko-tabellen
        [HttpPost("portfolio")]
        public IActionResult AddToPortfolio(Coin coin)
        {
            _context.Coins.Add(coin);
            _context.SaveChanges();
            return Ok();
        }

        // Uppdatera holdings för ett coin i portfolion
        [HttpPut("portfolio/{coinId}")]
        public async Task<IActionResult> UpdateCoin(string coinId, [FromBody] Coin updatedCoin)
        {
            var coin = await _context.Coins.FirstOrDefaultAsync(c => c.CoinId == coinId);

            if (coin == null)
            {
                return NotFound();
            }

            coin.Holdings = updatedCoin.Holdings;

            await _context.SaveChangesAsync();

            return NoContent();
        }

        // Ta bort ett coin från portfolion baserat på coinId (sträng)
        [HttpDelete("portfolio/{coinId}")]
        public IActionResult RemoveCoinFromPortfolio(string coinId)
        {
            var coin = _context.Coins.FirstOrDefault(c => c.CoinId == coinId);

            if (coin == null)
            {
                return NotFound();
            }

            _context.Coins.Remove(coin);
            _context.SaveChanges();

            return Ok();
        }

    }
}
