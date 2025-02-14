using CoinPortBackend.Data;
using CoinPortBackend.Models;
using Microsoft.AspNetCore.Mvc;
using Newtonsoft.Json.Linq;

namespace CoinPortBackend.Controllers
{
    [Route("/coins")]
    [ApiController]
    public class CoinController : ControllerBase
    {
        /// PROPERTIES ///
        private readonly CoinDbContext _context; // Dependency injection för att komma åt databasen
        private readonly HttpClient _httpClient; // Dependency injection för att göra HTTP-anrop
        private readonly string _apiKey;

        /// CONSTRUCTOR ///
        public CoinController(CoinDbContext context, HttpClient httpClient, IConfiguration configuration)
        {
            _context = context; // Spara instansen i ett fält för att komma åt databasen
            _httpClient = httpClient; // Spara instansen i ett fält för att göra HTTP-anrop
            _apiKey = configuration["CoinGeckoApiKey"]; // Hämta API-nyckeln från appsettings.json

            // TODO: Lägg till validering för att säkerställa att _apiKey inte är null eller tom
        }

        /// API ENDPOINTS ///

        // Hämta och visa alla coins som är sparade i portfolion
        [HttpGet("portfolio")]
        public IActionResult GetPortfolio()
        {
            return Ok(_context.Coins.ToList());
        }

        // Hämta de 20 största kryptovalutorna från CoinGecko
        [HttpGet("coingecko/current-market")]
        public async Task<IActionResult> GetCurrentMarketFromCoingecko()
        {
            // Kontrollera om headern redan finns, annars lägg till den
            if (!_httpClient.DefaultRequestHeaders.Contains("x-cg-demo-api-key"))
            {
                _httpClient.DefaultRequestHeaders.Add("x-cg-demo-api-key", _apiKey);
            }

            // Lägg till API-nyckel i header
            _httpClient.DefaultRequestHeaders.Add("x-cg-demo-api-key", _apiKey);

            // Gör ett GET-anrop till CoinGecko API
            var response = await _httpClient.GetStringAsync("https://api.coingecko.com/api/v3/coins/markets?vs_currency=usd&order=market_cap_desc&per_page=20&page=1&sparkline=false");

            // Parsa JSON-svaret och skapa en lista med objekt. JArray är en del av Newtonsoft.Json som används för att hantera JSON
            var coins = JArray.Parse(response).Select(c => new
            {
                CoinId = c["id"].ToString(),
                Name = c["name"].ToString(),
                Ticker = c["symbol"].ToString().ToUpper(),
                Price = (decimal)c["current_price"],
                Change24hPercent = Math.Round((decimal)c["price_change_percentage_24h"], 2)
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

        // Ta bort en coin från portfolio
        [HttpDelete("portfolio/{id}")]
        public IActionResult RemoveFromPortfolio(int id)
        {
            var coin = _context.Coins.Find(id);

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
