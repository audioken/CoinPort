using CoinPortBackend.Models;
using Microsoft.EntityFrameworkCore;

namespace CoinPortBackend.Data
{
    public class CoinDbContext : DbContext
    {
        public DbSet<Coin> Coins { get; set; }

        public CoinDbContext(DbContextOptions<CoinDbContext> options) : base(options)
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
        }
    }
}
