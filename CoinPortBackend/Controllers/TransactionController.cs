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

        // Hämta alla transaktioner
        [HttpGet]
        public IActionResult GetTransactions()
        {
            return Ok(_database.Transactions.ToList());
        }

        // Hämta en transaktion
        [HttpGet("{transactionId}")]
        public IActionResult GetTransaction(int transactionId)
        {
            var transaction = _database.Transactions
                .FirstOrDefault(t => t.Id == transactionId);

            if (transaction == null)
            {
                return NotFound();
            }

            return Ok(transaction);
        }

        // Hämta ett coins transaktioner
        [HttpGet("coin/{coinId}")]
        public IActionResult GetCoinTransactions(string coinId)
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

        // Redigera en transaktion
        [HttpPut("{id}")]
        public IActionResult UpdateTransaction(int id, [FromBody] Transaction updatedTransaction)
        {
            var transaction = _database.Transactions
                .FirstOrDefault(t => t.Id == id);

            if (transaction == null)
            {
                return NotFound();
            }

            transaction.CoinId = updatedTransaction.CoinId;
            transaction.Name = updatedTransaction.Name;
            transaction.Ticker = updatedTransaction.Ticker;
            transaction.Type = updatedTransaction.Type;
            transaction.CoinAmount = updatedTransaction.CoinAmount;
            transaction.CoinPrice = updatedTransaction.CoinPrice;
            transaction.Date = updatedTransaction.Date;

            var coin = _database.Coins
                .FirstOrDefault(c => c.CoinId == transaction.CoinId);

            if (coin != null)
            {
                // Minska holdings med transaktionens coinAmount
                coin.Holdings -= transaction.CoinAmount;

                // Se till att holdings inte blir negativ
                if (coin.Holdings < 0) coin.Holdings = 0;

                // Spara ändringen i databasen
                _database.Coins.Update(coin);
            }

            _database.Transactions.Update(transaction);
            _database.SaveChanges();

            return Ok(transaction);
        }

        // Ta bort en transaktion
        [HttpDelete("{id}")]
        public IActionResult DeleteTransaction(int id)
        {
            var transaction = _database.Transactions
                .FirstOrDefault(t => t.Id == id);

            if (transaction == null)
            {
                return NotFound();
            }

            var coin = _database.Coins
                .FirstOrDefault(c => c.CoinId == transaction.CoinId);

            if (coin != null)
            {
                if (transaction.Type == "Buy")
                {
                    // Minska holdings med transaktionens coinAmount
                    coin.Holdings -= transaction.CoinAmount;

                    // Se till att holdings inte blir negativ
                    if (coin.Holdings < 0) coin.Holdings = 0;
                }
                else if (transaction.Type == "Sell")
                {
                    // Öka holdings med transaktionens coinAmount
                    coin.Holdings += transaction.CoinAmount;
                }

                // Spara ändringen i databasen
                _database.Coins.Update(coin);
            }

            _database.Transactions.Remove(transaction);
            _database.SaveChanges();

            return NoContent();
        }

        // Ta bort ett coins transaktioner
        [HttpDelete("coin/{coinId}")]
        public IActionResult DeleteCoinTransactions(string coinId)
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
