using System.ComponentModel.DataAnnotations;

namespace CoinPortBackend.Models
{
    public class Coin
    {
        [Key]
        public int Id { get; set; }

        [Required]
        public int Rank { get; set; }

        [Required]
        [MaxLength(50)]
        public string CoinId { get; set; }

        [Required]
        [MaxLength(50)]
        public string Name { get; set; }

        [Required]
        [MaxLength(50)]
        public string Ticker { get; set; }

        public decimal Price { get; set; }
        public decimal Change24hPercent { get; set; } = 0;
        public decimal Holdings { get; set; } = 0;
        public decimal Value { get; set; } = 0;
    }
}
