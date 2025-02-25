using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace CoinPortBackend.Migrations
{
    /// <inheritdoc />
    public partial class increasedDecimalsinDbContext : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AlterColumn<decimal>(
                name: "CoinPrice",
                table: "Transactions",
                type: "decimal(18,14)",
                precision: 18,
                scale: 14,
                nullable: false,
                oldClrType: typeof(decimal),
                oldType: "decimal(18,10)",
                oldPrecision: 18,
                oldScale: 10);

            migrationBuilder.AlterColumn<decimal>(
                name: "Price",
                table: "Coins",
                type: "decimal(18,14)",
                precision: 18,
                scale: 14,
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
                name: "CoinPrice",
                table: "Transactions",
                type: "decimal(18,10)",
                precision: 18,
                scale: 10,
                nullable: false,
                oldClrType: typeof(decimal),
                oldType: "decimal(18,14)",
                oldPrecision: 18,
                oldScale: 14);

            migrationBuilder.AlterColumn<decimal>(
                name: "Price",
                table: "Coins",
                type: "decimal(18,10)",
                precision: 18,
                scale: 10,
                nullable: false,
                oldClrType: typeof(decimal),
                oldType: "decimal(18,14)",
                oldPrecision: 18,
                oldScale: 14);
        }
    }
}
