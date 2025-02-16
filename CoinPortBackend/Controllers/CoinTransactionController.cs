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


        [HttpDelete("transaction/{coinId}")]
        public IActionResult DeleteCoinTransaction(string coinId)
        {
            var coinTransaction = _context.CoinTransactions
                .FirstOrDefault(t => t.CoinId == coinId);

            if (coinTransaction == null)
            {
                return NotFound();
            }

            _context.CoinTransactions.Remove(coinTransaction);
            _context.SaveChanges();

            return NoContent();
        }


        [HttpDelete("coin/{coinId}")]
        public IActionResult DeleteAllCoinTransactions(string coinId)
        {
            // Hämta alla transaktioner som ska tas bort
            var transactionsToDelete = _context.CoinTransactions
                .Where(t => t.CoinId == coinId)
                .ToList();

            // Om det inte finns några transaktioner att ta bort
            if (!transactionsToDelete.Any())
            {
                return NotFound();
            }

            // Ta bort alla transaktioner
            _context.CoinTransactions.RemoveRange(transactionsToDelete);

            // Spara ändringarna
            _context.SaveChanges();

            // Returnera NoContent för att indikera att det gick bra
            return NoContent();
        }

    }
}
