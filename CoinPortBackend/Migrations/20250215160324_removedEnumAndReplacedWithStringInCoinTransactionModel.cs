using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace CoinPortBackend.Migrations
{
    /// <inheritdoc />
    public partial class removedEnumAndReplacedWithStringInCoinTransactionModel : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AlterColumn<string>(
                name: "Type",
                table: "CoinTransactions",
                type: "nvarchar(4)",
                maxLength: 4,
                nullable: false,
                oldClrType: typeof(int),
                oldType: "int");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AlterColumn<int>(
                name: "Type",
                table: "CoinTransactions",
                type: "int",
                nullable: false,
                oldClrType: typeof(string),
                oldType: "nvarchar(4)",
                oldMaxLength: 4);
        }
    }
}
