using CoinPortBackend.Data;
using CoinPortBackend.Models;
using Microsoft.AspNetCore.Mvc;

namespace CoinPortBackend.Controllers
{
    [Route("/coin-transactions")]
    [ApiController]
    public class CoinTransactionController : ControllerBase
    {
        private readonly AppDbContext _context; // Dependency injection för att komma åt databasen

        public CoinTransactionController(AppDbContext context)
        {
            _context = context; // Spara instansen i ett fält för att komma åt databasen
        }

        [HttpGet]
        public IActionResult GetCoinTransactions()
        {
            return Ok(_context.CoinTransactions.ToList());
        }

        [HttpPost]
        public IActionResult AddCoinTransaction(CoinTransaction coinTransaction)
        {
            _context.CoinTransactions.Add(coinTransaction);
            _context.SaveChanges();
            return Ok(coinTransaction);
        }

        [HttpDelete("{id}")]
        public IActionResult DeleteCoinTransaction(int id)
        {
            var coinTransaction = _context.CoinTransactions.Find(id);
            if (coinTransaction == null)
            {
                return NotFound();
            }
            _context.CoinTransactions.Remove(coinTransaction);
            _context.SaveChanges();
            return Ok(coinTransaction);
        }
    }
}
