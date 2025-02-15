using CoinPortBackend.Models;
using Microsoft.EntityFrameworkCore;

namespace CoinPortBackend.Data
{
    public class AppDbContext : DbContext
    {
        public DbSet<Coin> Coins { get; set; }
        public DbSet<CoinTransaction> CoinTransactions { get; set; }

        public AppDbContext(DbContextOptions<AppDbContext> options) : base(options)
        {
        }

        protected override void OnModelCreating(ModelBuilder modelBuilder)
        {
            modelBuilder.Entity<Coin>()
                .Property(c => c.Price)
                .HasPrecision(18, 4);

            modelBuilder.Entity<Coin>()
                .Property(c => c.Change24hPercent)
                .HasPrecision(18, 4);

            modelBuilder.Entity<Coin>()
                .Property(c => c.Holdings)
                .HasPrecision(18, 4);

            modelBuilder.Entity<Coin>()
                .Property(c => c.Value)
                .HasPrecision(18, 4);

            modelBuilder.Entity<CoinTransaction>()
                .Property(c => c.CoinPrice)
                .HasPrecision(18, 4);

            modelBuilder.Entity<CoinTransaction>()
                .Property(c => c.CoinAmount)
                .HasPrecision(18, 4);
        }
    }
}
