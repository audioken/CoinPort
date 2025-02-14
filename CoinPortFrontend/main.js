// Lagra serverns adress i en variabel
const api = 'https://localhost:7026';

// Finns för att spara CoinGecko-data i minnet.
let coinGeckoData = {}; // Nollställ minnet

// Hämta element från HTML
let btnRefresh = document.getElementById('btnRefresh'); // Hämta knappen för att uppdatera tabellerna

// Starta sidan och hämta data från CoinGecko och API
function start() {
    loadCoinGeckoCoins().then(loadCoins);
}

// Hämta senaste marknadsdata för coins från CoinGecko och fyll i CoinGecko-tabellen
async function loadCoinGeckoCoins() {
    const url = api + '/coins/coingecko/current-market'; // Hämta fullständig URL
    const response = await fetch(url); // Hämta data från URL
    const coins = await response.json(); // Konvertera data till JSON

    // Hämta tbody-elementet från coingecko-tabellen i HTML
    const tbody = document.getElementById('coingecko-tbody');
    tbody.replaceChildren(); // Rensa tabellen

    coinGeckoData = {}; // Nollställ minnet av CoinGecko-data

    // Loopa igenom alla coins och skapa en rad i tabellen för varje coin
    coins.forEach(coin => {
        coinGeckoData[coin.coinId] = coin; // Spara coinet med coinId som nyckel

        const row = document.createElement('tr'); // Skapa en rad

        // Skapa celler för varje värde i coin-objektet
        const coinIdCell = document.createElement('td');
        coinIdCell.textContent = coin.coinId; // coinId

        const nameCell = document.createElement('td');
        nameCell.textContent = coin.name; // name

        const tickerCell = document.createElement('td');
        tickerCell.textContent = coin.ticker; // ticker

        const priceCell = document.createElement('td');
        priceCell.textContent = '$' + coin.price; // price

        const change24hCell = document.createElement('td');
        change24hCell.textContent = coin.change24hPercent + '%'; // change24hPercent

        // Skapa en cell för knappen som lägger till coinet i portfolion
        const actionCell = document.createElement('td');
        const addButton = document.createElement('button'); // Skapa knappen
        addButton.textContent = 'Add to Portfolio'; // Text på knappen

        // Lägg till en eventlistener på knappen som anropar funktionen för att lägga till coinet i portfolion
        addButton.onclick = () => addCoinToPortfolio(coin.coinId, coin.name, coin.ticker, coin.price, coin.change24hPercent);
        
        // Lägg till alla celler i raden och raden i tbody samt knappen i actionCell
        actionCell.appendChild(addButton);
        row.append(nameCell, tickerCell, priceCell, change24hCell, actionCell);
        tbody.appendChild(row);
    });
}

// Hämta coins från API och fyll i portfolio-tabellen
async function loadCoins() {
    const url = api + '/coins/portfolio';  // Hämta fullständig URL
    const response = await fetch(url); // Hämta data från URL
    const coins = await response.json(); // Konvertera data till JSON

    // Hämta tbody-elementet från portfolio-tabellen i HTML
    const tbody = document.getElementById('coins-tbody');
    tbody.replaceChildren(); // Rensa tabellen

    // Loopa igenom alla coins och skapa en rad i tabellen för varje coin
    coins.forEach(coin => {
        const row = document.createElement('tr'); // Skapa en rad

        // Hämta senaste den sparade CoinGecko-datan för coinet
        const geckoCoin = coinGeckoData[coin.coinId];
        const updatedIdCell = geckoCoin ? geckoCoin.coinId : coin.coinId;
        const updatedName = geckoCoin ? geckoCoin.name : coin.name;
        const updatedTicker = geckoCoin ? geckoCoin.ticker : coin.ticker;
        const updatedPrice = geckoCoin ? geckoCoin.price : coin.price;
        const updatedChange24h = geckoCoin ? geckoCoin.change24hPercent : coin.change24hPercent;

        // Skapa celler med den uppdaterade datan för varje värde i coin-objektet
        const coinIdCell = document.createElement('td');
        coinIdCell.textContent = updatedIdCell; // coinId

        const nameCell = document.createElement('td');
        nameCell.textContent = updatedName; // name

        const tickerCell = document.createElement('td');
        tickerCell.textContent = updatedTicker; // ticker

        const priceCell = document.createElement('td');
        priceCell.textContent = '$' + updatedPrice; // price

        const change24hCell = document.createElement('td');
        change24hCell.textContent = updatedChange24h.toFixed(2) + '%'; // change24hPercent

        const holdingsCell = document.createElement('td');
        holdingsCell.textContent = coin.holdings; // holdings

        // Cell som räknar ut värdet av coinet baserat på antal holdings och pris
        const valueCell = document.createElement('td');
        valueCell.textContent = '$' + (updatedPrice * coin.holdings).toFixed(0); // value

        // Skapa en cell för knappen som tar bort coinet från portfolion
        const actionCell = document.createElement('td');
        const removeButton = document.createElement('button'); // Skapa knappen
        removeButton.textContent = 'Remove from Portfolio'; // Text på knappen

        // Lägg till en eventlistener på knappen som anropar funktionen för att ta bort coinet från portfolion
        removeButton.onclick = () => removeCoinFromPortfolio(coin.id); 

        // Lägg till alla celler i raden och raden i tbody samt knappen i actionCell
        actionCell.appendChild(removeButton);
        row.append(nameCell, tickerCell, priceCell, change24hCell, holdingsCell, valueCell, actionCell);
        tbody.appendChild(row);
    });
}

// Funktion för att lägga till coin i portfolion
async function addCoinToPortfolio(coinId, name, ticker, price, change24hPercent) {
    const url = api + '/coins/portfolio'; // Hämta fullständig URL

    // Skicka en POST-request med coinId, name, ticker, price, change24hPercent och holdings
    const response = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' }, // Sätt header för att skicka JSON
        body: JSON.stringify({ // Konvertera objekt till JSON
            coinId: coinId,
            name: name,
            ticker: ticker,
            price: price,
            change24hPercent: change24hPercent,
            holdings: 0
        })
    });

    // Om requesten lyckades, ladda om coins
    if (response.ok) {
        loadCoins();
    } else {
        alert('Failed to add coin!');
    }
}

// Funktion för att ta bort coin från portfolion
async function removeCoinFromPortfolio(coinId) {
    const url = `${api}/coins/portfolio/${coinId}`; // Hämta fullständig URL

    // Skicka en DELETE-request
    const response = await fetch(url, {
        method: 'DELETE'
    });

    // Om requesten lyckades, ladda om coins
    if (response.ok) {
        loadCoins();
    } else {
        alert('Failed to remove coin!');
    }
}

// Lägg till en eventlistener på knappen för att uppdatera tabellerna
btnRefresh.addEventListener('click', () => {
    loadCoinGeckoCoins().then(loadCoins);
});

// Körs när sidan laddas
start();

