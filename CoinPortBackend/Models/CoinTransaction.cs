using System.ComponentModel.DataAnnotations;

namespace CoinPortBackend.Models
{
    public class CoinTransaction
    {
        [Key]
        public int Id { get; set; }

        [Required]
        [MaxLength(50)]
        public string CoinId { get; set; } = string.Empty;

        [Required]
        [MaxLength(50)]
        public string Name { get; set; } = string.Empty;

        [Required]
        [MaxLength(50)]
        public string Ticker { get; set; } = string.Empty;

        [Required]
        [MaxLength(4)]
        public string Type { get; set; } = string.Empty;

        [Required]
        public decimal CoinAmount { get; set; }

        [Required]
        public decimal CoinPrice { get; set; }

        [Required]
        public DateTime Date { get; set; }
    }
}


