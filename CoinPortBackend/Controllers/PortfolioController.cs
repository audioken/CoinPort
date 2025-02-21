using CoinPortBackend.Data;
using CoinPortBackend.Models;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace CoinPortBackend.Controllers
{
    [Route("/coins")]
    [ApiController]
    public class PortfolioController : ControllerBase
    {
        // Dependency injection för att komma åt databasen
        private readonly AppDbContext _context;

        public PortfolioController(AppDbContext context)
        {
            _context = context;
        }

        // Hämta och visa alla coins som är sparade i portfolion
        [HttpGet]
        public IActionResult GetAllPortfolioCoins()
        {
            return Ok(_context.Coins.ToList());
        }

        // Hämta ett specifikt coin från portfolion baserat på coinId (sträng)
        [HttpGet("{coinId}")]
        public IActionResult GetCoinFromPortfolio(string coinId)
        {
            var coin = _context.Coins.FirstOrDefault(c => c.CoinId == coinId);

            if (coin == null)
            {
                return NotFound();
            }

            return Ok(coin);
        }

        // Lägg till en coin i portfolio från CoinGecko-tabellen
        [HttpPost]
        public IActionResult AddToPortfolio(Coin coin)
        {
            _context.Coins.Add(coin);
            _context.SaveChanges();
            return Ok();
        }

        // Uppdatera holdings för ett coin i portfolion
        [HttpPut("{coinId}")]
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
        [HttpDelete("{coinId}")]
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
