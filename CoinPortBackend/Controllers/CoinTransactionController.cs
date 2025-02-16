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
        public IActionResult GetAllCoinTransactions()
        {
            return Ok(_context.CoinTransactions.ToList());
        }

        [HttpGet("{coinId}")]
        public IActionResult GetCoinTransactions(string coinId)
        {
            var coinTransactions = _context.CoinTransactions
                .Where(transaction => transaction.CoinId == coinId)
                .ToList();

            return Ok(coinTransactions);
        }

        [HttpPost]
        public IActionResult AddCoinTransaction(CoinTransaction coinTransaction)
        {
            _context.CoinTransactions.Add(coinTransaction);
            _context.SaveChanges();
            return Ok(coinTransaction);
        }

        [HttpDelete("{coinId}")]
        public IActionResult DeleteCoinTransaction(int coinId)
        {
            var coinTransaction = _context.CoinTransactions.Find(coinId);
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
