const api = 'https://localhost:7026';

function start() {
    loadCoins();
    loadCoinGeckoCoins();
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

        const nameCell = document.createElement('td');
        nameCell.textContent = coin.name;

        const tickerCell = document.createElement('td');
        tickerCell.textContent = coin.ticker; // Samma här

        const priceCell = document.createElement('td');
        priceCell.textContent = '$' + coin.price;

        const actionCell = document.createElement('td');
        const removeButton = document.createElement('button');

        removeButton.textContent = 'Remove from Portfolio';
        removeButton.onclick = () => removeCoinFromPortfolio(coin.id, coin.name);
        actionCell.appendChild(removeButton);


        row.append(nameCell, tickerCell, priceCell, actionCell);
        tbody.appendChild(row);
    });
}

// Hämta senaste marknadsdata från CoinGecko och fyll i CoinGecko-tabellen (coingecko-tbody)
async function loadCoinGeckoCoins() {
    const url = api + '/coins/coingecko/current-market';
    const response = await fetch(url);
    const coins = await response.json();

    const tbody = document.getElementById('coingecko-tbody');
    tbody.replaceChildren();

    coins.forEach(coin => {
        const row = document.createElement('tr');

        const coinIdCell = document.createElement('td');
        coinIdCell.textContent = coin.coinId;

        const nameCell = document.createElement('td');
        nameCell.textContent = coin.name;

        const tickerCell = document.createElement('td');
        tickerCell.textContent = coin.ticker;

        const priceCell = document.createElement('td');
        priceCell.textContent = '$' + coin.price;

        const actionCell = document.createElement('td');
        const addButton = document.createElement('button');

        addButton.textContent = 'Add to Portfolio';
        addButton.onclick = () => addCoinToPortfolio(coin.coinId, coin.name, coin.ticker, coin.price);
        actionCell.appendChild(addButton);

        row.append(nameCell, tickerCell, priceCell, actionCell);
        tbody.appendChild(row);
    });
}

// Lägg till ett coin i databasen/portfolion
async function addCoinToPortfolio(coinId, name, ticker, price) {
    const url = api + '/coins/portfolio'; 
    const response = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
            coinId: coinId,
            name: name,
            ticker: ticker,
            price: price
        })
    });

    if (response.ok) {
        loadCoins();
    } else {
        alert('Failed to add coin!');
    }
}

async function removeCoinFromPortfolio(coinId, name) {
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

start();
