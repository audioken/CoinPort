const api = 'https://localhost:7026';
let coinGeckoData = {}; // Sparar CoinGecko-data i minnet
let btnRefresh = document.getElementById('btnRefresh');

function start() {
    loadCoinGeckoCoins().then(loadCoins);
}

// Hämta senaste marknadsdata från CoinGecko och fyll i CoinGecko-tabellen
async function loadCoinGeckoCoins() {
    const url = api + '/coins/coingecko/current-market';
    const response = await fetch(url);
    const coins = await response.json();

    const tbody = document.getElementById('coingecko-tbody');
    tbody.replaceChildren();

    // Spara CoinGecko-data i minnet för att använda i portfolio-tabellen
    coinGeckoData = {};
    coins.forEach(coin => {
        coinGeckoData[coin.coinId] = coin; // Spara coinet med coinId som nyckel

        const row = document.createElement('tr');

        const coinIdCell = document.createElement('td');
        coinIdCell.textContent = coin.coinId;

        const nameCell = document.createElement('td');
        nameCell.textContent = coin.name;

        const tickerCell = document.createElement('td');
        tickerCell.textContent = coin.ticker;

        const priceCell = document.createElement('td');
        priceCell.textContent = '$' + coin.price;

        const change24hCell = document.createElement('td');
        change24hCell.textContent = coin.change24hPercent + '%';

        const actionCell = document.createElement('td');
        const addButton = document.createElement('button');

        addButton.textContent = 'Add to Portfolio';
        addButton.onclick = () => addCoinToPortfolio(coin.coinId, coin.name, coin.ticker, coin.price, coin.change24hPercent);
        actionCell.appendChild(addButton);

        row.append(nameCell, tickerCell, priceCell, change24hCell, actionCell);
        tbody.appendChild(row);
    });
}

// Hämta coins från API och fyll i portfolio-tabellen
async function loadCoins() {
    const url = api + '/coins/portfolio'; 
    const response = await fetch(url);
    const coins = await response.json();

    const tbody = document.getElementById('coins-tbody');
    tbody.replaceChildren();

    coins.forEach(coin => {
        const row = document.createElement('tr');

        const coinIdCell = document.createElement('td');
        coinIdCell.textContent = coin.coinId;

        const nameCell = document.createElement('td');
        nameCell.textContent = coin.name;

        const tickerCell = document.createElement('td');
        tickerCell.textContent = coin.ticker;

        // Hämta senaste pris och förändring från CoinGecko-datan vi sparade i minnet
        const geckoCoin = coinGeckoData[coin.coinId];
        const updatedPrice = geckoCoin ? geckoCoin.price : coin.price;
        const updatedChange24h = geckoCoin ? geckoCoin.change24hPercent : coin.change24hPercent;

        const priceCell = document.createElement('td');
        priceCell.textContent = '$' + updatedPrice;

        const change24hCell = document.createElement('td');
        change24hCell.textContent = updatedChange24h.toFixed(2) + '%';

        const holdingsCell = document.createElement('td');
        holdingsCell.textContent = coin.holdings;

        const valueCell = document.createElement('td');
        valueCell.textContent = '$' + (updatedPrice * coin.holdings).toFixed(0);

        const actionCell = document.createElement('td');
        const removeButton = document.createElement('button');
        removeButton.textContent = 'Remove from Portfolio';
        removeButton.onclick = () => removeCoinFromPortfolio(coin.id);
        actionCell.appendChild(removeButton);

        row.append(nameCell, tickerCell, priceCell, change24hCell, holdingsCell, valueCell, actionCell);
        tbody.appendChild(row);
    });
}

// Lägg till ett coin i databasen/portfolion
async function addCoinToPortfolio(coinId, name, ticker, price, change24hPercent) {
    const url = api + '/coins/portfolio'; 
    const response = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
            coinId: coinId,
            name: name,
            ticker: ticker,
            price: price,
            change24hPercent: change24hPercent,
            holdings: 0 // Du kanske vill fråga användaren om holdings?
        })
    });

    if (response.ok) {
        loadCoins();
    } else {
        alert('Failed to add coin!');
    }
}

async function removeCoinFromPortfolio(coinId) {
    const url = `${api}/coins/portfolio/${coinId}`;
    const response = await fetch(url, {
        method: 'DELETE'
    });

    if (response.ok) {
        loadCoins();
    } else {
        alert('Failed to remove coin!');
    }
}

btnRefresh.addEventListener('click', () => {
    loadCoinGeckoCoins().then(loadCoins);
});

start();

