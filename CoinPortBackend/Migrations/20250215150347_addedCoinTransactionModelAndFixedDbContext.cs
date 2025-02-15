using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace CoinPortBackend.Migrations
{
    /// <inheritdoc />
    public partial class addedCoinTransactionModelAndFixedDbContext : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.CreateTable(
                name: "CoinTransactions",
                columns: table => new
                {
                    Id = table.Column<int>(type: "int", nullable: false)
                        .Annotation("SqlServer:Identity", "1, 1"),
                    CoinId = table.Column<string>(type: "nvarchar(50)", maxLength: 50, nullable: false),
                    Name = table.Column<string>(type: "nvarchar(50)", maxLength: 50, nullable: false),
                    Ticker = table.Column<string>(type: "nvarchar(50)", maxLength: 50, nullable: false),
                    Type = table.Column<int>(type: "int", nullable: false),
                    CoinAmount = table.Column<decimal>(type: "decimal(18,4)", precision: 18, scale: 4, nullable: false),
                    CoinPrice = table.Column<decimal>(type: "decimal(18,4)", precision: 18, scale: 4, nullable: false),
                    Date = table.Column<DateTime>(type: "datetime2", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_CoinTransactions", x => x.Id);
                });
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "CoinTransactions");
        }
    }
}
