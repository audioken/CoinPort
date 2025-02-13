using System.ComponentModel.DataAnnotations;

namespace CoinPortBackend.Models
{
    public class Coin
    {
        [Key]
        public int Id { get; set; }

        [Required]
        [MaxLength(50)]
        public string CoinId { get; set; }

        [Required]
        [MaxLength(50)]
        public string Name { get; set; }

        [Required]
        [MaxLength(50)]
        public string Ticker { get; set; }

        [Required]
        public decimal Price { get; set; }
    }
}
