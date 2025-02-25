using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace CoinPortBackend.Migrations
{
    /// <inheritdoc />
    public partial class changedPrecisionOnCoinAmountInDbContext : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AlterColumn<decimal>(
                name: "CoinAmount",
                table: "Transactions",
                type: "decimal(24,10)",
                precision: 24,
                scale: 10,
                nullable: false,
                oldClrType: typeof(decimal),
                oldType: "decimal(18,10)",
                oldPrecision: 18,
                oldScale: 10);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AlterColumn<decimal>(
                name: "CoinAmount",
                table: "Transactions",
                type: "decimal(18,10)",
                precision: 18,
                scale: 10,
                nullable: false,
                oldClrType: typeof(decimal),
                oldType: "decimal(24,10)",
                oldPrecision: 24,
                oldScale: 10);
        }
    }
}
