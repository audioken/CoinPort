using CoinPortBackend.Data;
using CoinPortBackend.Models;
using Microsoft.AspNetCore.Mvc;

namespace CoinPortBackend.Controllers
{
    [Route("/transactions")]
    public class TransactionController : ControllerBase
    {
        private readonly AppDbContext _database;

        public TransactionController(AppDbContext database)
        {
            _database = database;
        }

        // Hämta alla transaktioner från alla coins
        [HttpGet]
        public IActionResult GetTransactions()
        {
            return Ok(_database.Transactions.ToList());
        }

        // Hämta alla transaktioner för ett specifikt coin
        [HttpGet("{coinId}")]
        public IActionResult GetAllCoinTransactions(string coinId)
        {
            var transactions = _database.Transactions
                .Where(t => t.CoinId == coinId)
                .ToList();

            return Ok(transactions);
        }

        // Lägg till en transaktion
        [HttpPost]
        public IActionResult AddTransaction([FromBody] Transaction transaction)
        {
            _database.Transactions.Add(transaction);
            _database.SaveChanges();
            return Ok(transaction);
        }

        // Ta bort en specifik transaktion baserat på transactionId
        [HttpDelete("{id}")]
        public IActionResult DeleteTransaction(int id)
        {
            var transaction = _database.Transactions
                .FirstOrDefault(t => t.Id == id);

            if (transaction == null)
            {
                return NotFound();
            }

            _database.Transactions.Remove(transaction);
            _database.SaveChanges();

            return NoContent();
        }

        // Ta bort alla transaktioner för ett specifikt coin
        [HttpDelete("coin/{coinId}")]
        public IActionResult DeleteAllCoinTransactions(string coinId)
        {
            // Hämta alla transaktioner som ska tas bort
            var transactions = _database.Transactions
                .Where(t => t.CoinId == coinId)
                .ToList();

            // Om det inte finns några transaktioner att ta bort
            if (!transactions.Any())
            {
                return NotFound();
            }

            // Ta bort alla transaktioner
            _database.Transactions.RemoveRange(transactions);

            // Spara ändringarna
            _database.SaveChanges();

            // Returnera NoContent för att indikera att det gick bra
            return NoContent();
        }
    }
}
