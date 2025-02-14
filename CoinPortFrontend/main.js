// Lagra serverns adress i en variabel
const api = 'https://localhost:7026';

// Finns för att spara CoinGecko-data i minnet.
let coinGeckoData = {}; // Nollställ minnet

// Hämta element från HTML
let btnRefresh = document.getElementById('btnRefresh'); // Hämta knappen för att uppdatera tabellerna

const searchCoinInput = document.getElementById('searchCoinInput');

// Hämta tbody-elementet från coingecko-tabellen i HTML
const coingecko_tbody = document.getElementById('coingecko-tbody');

// Hämta tbody-elementet från portfolio-tabellen i HTML
const coins_tbody = document.getElementById('coins-tbody');


// Starta sidan och hämta data från CoinGecko och API
function start() {
    loadCoinGeckoCoins().then(loadCoins);
}

// Hämta senaste marknadsdata för coins från CoinGecko och fyll i CoinGecko-tabellen
async function loadCoinGeckoCoins() {
    const url = api + '/coins/coingecko/current-market'; // Hämta fullständig URL
    const response = await fetch(url); // Hämta data från URL
    const coins = await response.json(); // Konvertera data till JSON

    coingecko_tbody.replaceChildren(); // Rensa tabellen

    coinGeckoData = {}; // Nollställ minnet av CoinGecko-data

    coins.forEach(coin => {
        coinGeckoData[coin.coinId] = coin; // Spara coinet med coinId som nyckel
    
        const row = document.createElement('tr'); // Skapa en rad
    
        // Skapa celler för varje värde i coin-objektet
        const coinIdCell = document.createElement('td');
        coinIdCell.textContent = coin.coinId;
    
        const nameCell = document.createElement('td');
        nameCell.textContent = coin.name;
    
        const tickerCell = document.createElement('td');
        tickerCell.textContent = coin.ticker;
    
        // const priceCell = document.createElement('td');
        // priceCell.textContent = '$' + parseFloat(coin.price).toLocaleString('en-US', { minimumFractionDigits: 0, maximumFractionDigits: 2 });

        // Format the price dynamically based on value
        const priceCell = document.createElement('td');
        priceCell.textContent = formatPrice(parseFloat(coin.price)); // Format price
        
        const change24hCell = document.createElement('td');
        change24hCell.textContent = parseFloat(coin.change24hPercent).toLocaleString('en-US', { minimumFractionDigits: 0, maximumFractionDigits: 2 }) + '%';
        
        const marketCapCell = document.createElement('td');
        marketCapCell.textContent = '$' + parseFloat(coin.marketCap).toLocaleString('en-US');        
    
        // Skapa en cell för knappen som lägger till coinet i portfolion
        const actionCell = document.createElement('td');
        const addButton = document.createElement('button'); // Skapa knappen
        addButton.textContent = 'Add to Portfolio'; // Text på knappen
    
        // Lägg till en eventlistener på knappen som anropar funktionen för att lägga till coinet i portfolion
        addButton.onclick = () => addCoinToPortfolio(coin.coinId, coin.name, coin.ticker, coin.price, coin.change24hPercent);
        
        // Lägg till alla celler i raden och raden i tbody samt knappen i actionCell
        actionCell.appendChild(addButton);
        row.append(nameCell, tickerCell, priceCell, change24hCell, marketCapCell, actionCell);
        coingecko_tbody.appendChild(row);
    });
    
}

// Hämta coins från API och fyll i portfolio-tabellen
async function loadCoins() {
    const url = api + '/coins/portfolio';  // Hämta fullständig URL
    const response = await fetch(url); // Hämta data från URL
    const coins = await response.json(); // Konvertera data till JSON


    coins_tbody.replaceChildren(); // Rensa tabellen

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
        coinIdCell.textContent = updatedIdCell; 

        const nameCell = document.createElement('td');
        nameCell.textContent = updatedName; 

        const tickerCell = document.createElement('td');
        tickerCell.textContent = updatedTicker; 

        const priceCell = document.createElement('td');
        priceCell.textContent = '$' + parseFloat(updatedPrice).toLocaleString('en-US', 
            { minimumFractionDigits: 0, maximumFractionDigits: 2 });
        
        const change24hCell = document.createElement('td');
        change24hCell.textContent = parseFloat(updatedChange24h).toLocaleString('en-US', 
            { minimumFractionDigits: 0, maximumFractionDigits: 2 }) + '%';

        const holdingsCell = document.createElement('td');
        holdingsCell.textContent = coin.holdings; 

        const valueCell = document.createElement('td');
        valueCell.textContent = '$' + (updatedPrice * coin.holdings).toFixed(0);

        // Skapa en cell för knappen som tar bort coinet från portfolion
        const actionCell = document.createElement('td');
        const removeButton = document.createElement('button'); // Skapa knappen
        removeButton.textContent = 'Remove from Portfolio'; // Text på knappen

        // Lägg till en eventlistener på knappen som anropar funktionen för att ta bort coinet från portfolion
        removeButton.onclick = () => removeCoinFromPortfolio(coin.id); 

        // Lägg till alla celler i raden och raden i tbody samt knappen i actionCell
        actionCell.appendChild(removeButton);
        row.append(nameCell, tickerCell, priceCell, change24hCell, holdingsCell, valueCell, actionCell);
        coins_tbody.appendChild(row);
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


// Funktion för att filtrera coins i CoinGecko-tabellen baserat på användarens sökterm
function searchCoin() {
    const filter = searchCoinInput.value.toLowerCase();
    const rows = document.getElementById('coingecko-tbody').getElementsByTagName('tr');

    for (let i = 0; i < rows.length; i++) {
        const nameCell = rows[i].getElementsByTagName('td')[0];
        const tickerCell = rows[i].getElementsByTagName('td')[1];

        if (nameCell && tickerCell) {
            const nameText = nameCell.textContent.toLowerCase();
            const tickerText = tickerCell.textContent.toLowerCase();

            if (nameText.includes(filter) || tickerText.includes(filter)) {
                rows[i].style.display = '';
            } else {
                rows[i].style.display = 'none';
            }
        }
    }
}


function formatPrice(price) {
    // Om priset är ett heltal, formatera utan decimaler
    if (price % 1 === 0) {
        return new Intl.NumberFormat('en-US', {
            style: 'currency',
            currency: 'USD',
            minimumFractionDigits: 0,
            maximumFractionDigits: 0
        }).format(price);
    } else if (price >= 1) {
        // Om priset är större än 1, visa 2 decimaler
        return new Intl.NumberFormat('en-US', {
            style: 'currency',
            currency: 'USD',
            minimumFractionDigits: 2,
            maximumFractionDigits: 2
        }).format(price);
    } else if (price >= 0.01) {
        // Om priset är under 1 men större än 0.01, visa 4 decimaler
        return new Intl.NumberFormat('en-US', {
            style: 'currency',
            currency: 'USD',
            minimumFractionDigits: 4,
            maximumFractionDigits: 4
        }).format(price);
    } else {
        // Om priset är under 0.01, visa 8 decimaler för mycket små värden
        return new Intl.NumberFormat('en-US', {
            style: 'currency',
            currency: 'USD',
            minimumFractionDigits: 8,
            maximumFractionDigits: 8
        }).format(price);
    }
}

// Keyup-event triggas varje gång användaren släpper en tangent,
// vilket gör att sökningen sker i realtid medan man skriver
searchCoinInput.addEventListener('keyup', searchCoin);

// Uppdaterar tabellerna
btnRefresh.addEventListener('click', () => {
    loadCoinGeckoCoins().then(loadCoins);
});

// Körs när sidan laddas
start();