using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace CoinPortBackend.Migrations
{
    /// <inheritdoc />
    public partial class changedPrecisionsOnMostModelBuildingInDbContext : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AlterColumn<decimal>(
                name: "CoinPrice",
                table: "Transactions",
                type: "decimal(24,10)",
                precision: 24,
                scale: 10,
                nullable: false,
                oldClrType: typeof(decimal),
                oldType: "decimal(18,14)",
                oldPrecision: 18,
                oldScale: 14);

            migrationBuilder.AlterColumn<decimal>(
                name: "Value",
                table: "Coins",
                type: "decimal(18,4)",
                precision: 18,
                scale: 4,
                nullable: false,
                oldClrType: typeof(decimal),
                oldType: "decimal(18,10)",
                oldPrecision: 18,
                oldScale: 10);

            migrationBuilder.AlterColumn<decimal>(
                name: "Price",
                table: "Coins",
                type: "decimal(18,12)",
                precision: 18,
                scale: 12,
                nullable: false,
                oldClrType: typeof(decimal),
                oldType: "decimal(18,14)",
                oldPrecision: 18,
                oldScale: 14);

            migrationBuilder.AlterColumn<decimal>(
                name: "Change24hPercent",
                table: "Coins",
                type: "decimal(18,6)",
                precision: 18,
                scale: 6,
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
                type: "decimal(18,14)",
                precision: 18,
                scale: 14,
                nullable: false,
                oldClrType: typeof(decimal),
                oldType: "decimal(24,10)",
                oldPrecision: 24,
                oldScale: 10);

            migrationBuilder.AlterColumn<decimal>(
                name: "Value",
                table: "Coins",
                type: "decimal(18,10)",
                precision: 18,
                scale: 10,
                nullable: false,
                oldClrType: typeof(decimal),
                oldType: "decimal(18,4)",
                oldPrecision: 18,
                oldScale: 4);

            migrationBuilder.AlterColumn<decimal>(
                name: "Price",
                table: "Coins",
                type: "decimal(18,14)",
                precision: 18,
                scale: 14,
                nullable: false,
                oldClrType: typeof(decimal),
                oldType: "decimal(18,12)",
                oldPrecision: 18,
                oldScale: 12);

            migrationBuilder.AlterColumn<decimal>(
                name: "Change24hPercent",
                table: "Coins",
                type: "decimal(18,10)",
                precision: 18,
                scale: 10,
                nullable: false,
                oldClrType: typeof(decimal),
                oldType: "decimal(18,6)",
                oldPrecision: 18,
                oldScale: 6);
        }
    }
}
