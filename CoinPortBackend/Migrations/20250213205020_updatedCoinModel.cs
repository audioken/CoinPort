using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace CoinPortBackend.Migrations
{
    /// <inheritdoc />
    public partial class updatedCoinModel : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.RenameColumn(
                name: "CoinId",
                table: "Coins",
                newName: "Ticker");

            migrationBuilder.AddColumn<string>(
                name: "Name",
                table: "Coins",
                type: "nvarchar(50)",
                maxLength: 50,
                nullable: false,
                defaultValue: "");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "Name",
                table: "Coins");

            migrationBuilder.RenameColumn(
                name: "Ticker",
                table: "Coins",
                newName: "CoinId");
        }
    }
}
