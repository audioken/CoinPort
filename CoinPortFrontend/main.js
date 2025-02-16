////////////////////////////////////////////////////////////////////////////////////////////////////////
/// VARIABLES & ELEMENTS ///
////////////////////////////

// Lagra serverns adress i en variabel
const api = 'https://localhost:7026';

// Finns för att spara CoinGecko-data i minnet.
let coinGeckoData = {}; // Nollställ minnet

// Hämta element från HTML
let btnRefresh = document.getElementById('btnRefresh'); // Hämta knappen för att uppdatera tabellerna
const inputSearchCoin = document.getElementById('inputSearchCoin');

// Hämta tbody-elementen från alla tabeller i HTML
const coingecko_tbody = document.getElementById('coingecko-tbody');
const coins_tbody = document.getElementById('coins-tbody');
const coins_transaction_tbody = document.getElementById('coins-transaction-tbody');

////////////////////////////////////////////////////////////////////////////////////////////////////////
/// MAIN FUNCTIONS ///
//////////////////////

// Starta sidan och hämta data från CoinGecko och API
function start() {
    loadCoinGeckoCoins()
        .then(loadPortfolioCoins)
        .then(loadCoinTransactions)
        .then(searchCoin);
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

        // Formatera priset med hjälp av formatPrice-funktionen
        const priceCell = document.createElement('td');
        priceCell.textContent = formatPrice(parseFloat(coin.price));
        
        const change24hCell = document.createElement('td');
        const change24hValue = coin.change24hPercent ?? 0; 
        change24hCell.textContent = parseFloat(coin.change24hPercent).toLocaleString('en-US', { minimumFractionDigits: 0, maximumFractionDigits: 2 }) + '%';
        
        const marketCapCell = document.createElement('td');
        marketCapCell.textContent = '$' + parseFloat(coin.marketCap).toLocaleString('en-US');        
    
        // Skapa en cell för knappen som lägger till coinet i portfolion
        const actionCell = document.createElement('td');
        const btnAddCoinToPortfolio = document.createElement('button'); // Skapa knappen
        btnAddCoinToPortfolio.classList.add('btnAddCoinToPortfolio');
        btnAddCoinToPortfolio.textContent = '➕'; // Text på knappen
    
        btnAddCoinToPortfolio.addEventListener('mouseover', showInfo); // Visa info när musen hovrar
        btnAddCoinToPortfolio.addEventListener('mouseout', hideInfo); // Dölj info när musen lämnar

        // Lägg till en eventlistener på knappen som anropar funktionen för att lägga till coinet i portfolion
        btnAddCoinToPortfolio.onclick = () => addCoinToPortfolio(coin.coinId, coin.name, coin.ticker, coin.price, coin.change24hPercent);
        
        // Lägg till alla celler i raden och raden i tbody samt knappen i actionCell
        actionCell.appendChild(btnAddCoinToPortfolio);
        row.append(nameCell, tickerCell, priceCell, change24hCell, marketCapCell, actionCell);
        coingecko_tbody.appendChild(row);
    });
    
}

// Hämta coins från API och fyll i portfolio-tabellen
async function loadPortfolioCoins() {
    const url = api + '/coins/portfolio';  // Hämta fullständig URL
    const response = await fetch(url); // Hämta data från URL
    const coins = await response.json(); // Konvertera data till JSON

    coins_tbody.replaceChildren(); // Rensa tabellen

    // Loopa igenom alla coins och skapa en rad i tabellen för varje coin
    coins.forEach(coin => {

        // Skapa själva raden som coinet ska ligga i
        const rowForCoin = document.createElement('tr');

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
        valueCell.textContent = formatPrice(parseFloat(updatedPrice * coin.holdings)); 

        // Skapa en cell för att hantera justering av holdings, 
        // samt knappar för att öka, minska, visa info och ta bort coinet
        const actionCell = document.createElement('td');

        // Skapa input-fält för att justera holdings i 'actionCell'
        const inputAmount = document.createElement('input');
        inputAmount.classList.add('inputAmount');
        inputAmount.type = 'text';
        inputAmount.placeholder = 'Adjust holdings..';
        
        // Skapa en div-container för att hålla knapparna i 'actionCell'
        const btnBar = document.createElement('div');

        // Skapa knappar för att öka, minska, visa info och ta bort coinet från portfolion
        const btnIncreaseHolding = document.createElement('button'); 
        btnIncreaseHolding.classList.add('btnIncrease');
        btnIncreaseHolding.textContent = '➕';

        const btnDecreaseHolding = document.createElement('button');
        btnDecreaseHolding.classList.add('btnDecrease'); 
        btnDecreaseHolding.textContent = '➖';

        const btnShowCoinInfo = document.createElement('button');
        btnShowCoinInfo.classList.add('btnShowInfo');
        btnShowCoinInfo.textContent = 'ℹ️';

        const btnRemoveCoinFromPortfolio = document.createElement('button');
        btnRemoveCoinFromPortfolio.classList.add('btnRemove');
        btnRemoveCoinFromPortfolio.textContent = '❌';

        // Visa eller döljer info om vad de olika elementen gör
        inputAmount.addEventListener('mouseover', showInfo);
        inputAmount.addEventListener('mouseout', hideInfo);

        btnIncreaseHolding.addEventListener('mouseover', showInfo); 
        btnIncreaseHolding.addEventListener('mouseout', hideInfo);

        btnDecreaseHolding.addEventListener('mouseover', showInfo); 
        btnDecreaseHolding.addEventListener('mouseout', hideInfo);

        btnShowCoinInfo.addEventListener('mouseover', showInfo);
        btnShowCoinInfo.addEventListener('mouseout', hideInfo); 

        btnRemoveCoinFromPortfolio.addEventListener('mouseover', showInfo); 
        btnRemoveCoinFromPortfolio.addEventListener('mouseout', hideInfo); 
        
        // Anropa funktioner baserat på vilken knapp som klickas
        btnIncreaseHolding.onclick = () => adjustHoldings(coin.id, inputAmount, coin.holdings, true);
        btnDecreaseHolding.onclick = () => adjustHoldings(coin.id, inputAmount, coin.holdings, false);
        // TODO: Skapa funktion för att visa info om coinet
        btnRemoveCoinFromPortfolio.onclick = () => removeCoinFromPortfolio(coin.id); 

        // Skapa och lägg till en rad för varje coin i tabellen, inklusive dess data och interaktiva knappar
        coins_tbody.appendChild(rowForCoin);
        rowForCoin.append(nameCell, tickerCell, priceCell, change24hCell, holdingsCell, valueCell, actionCell);
        actionCell.append(inputAmount, btnBar);
        btnBar.append(btnIncreaseHolding, btnDecreaseHolding, btnShowCoinInfo, btnRemoveCoinFromPortfolio);
    });
}

// Hämta transaktioner för coins och fyll i transaktionstabellen
async function loadCoinTransactions() {
    const url = api + '/coin-transactions';  // Hämta fullständig URL
    const response = await fetch(url); // Hämta data från URL
    const transactions = await response.json(); // Konvertera data till JSON

    coins_transaction_tbody.replaceChildren(); // Rensa tabellen

    // Loopa igenom alla coins och skapa en rad i tabellen för varje coin
    transactions.forEach(transaction => {
        // alert(transaction.price);
        // Skapa själva raden som coinet ska ligga i
        const rowForTransaction = document.createElement('tr');

        // Skapa celler med den uppdaterade datan för varje värde i coin-objektet
        const coinIdCell = document.createElement('td');
        coinIdCell.textContent = transaction.coinId; 

        const nameCell = document.createElement('td');
        nameCell.textContent = transaction.name; 

        const tickerCell = document.createElement('td');
        tickerCell.textContent = transaction.ticker; 

        const typeCell = document.createElement('td');
        typeCell.textContent = transaction.type; 

        const amountCell = document.createElement('td');
        amountCell.textContent = transaction.coinAmount; 

        const priceCell = document.createElement('td');
        priceCell.textContent = '$' + parseFloat(transaction.coinPrice).toLocaleString('en-US', 
            { minimumFractionDigits: 0, maximumFractionDigits: 2 });
        
        const valueCell = document.createElement('td');
        valueCell.textContent = formatPrice(parseFloat(transaction.coinPrice * transaction.coinAmount)); 

        const dateCell = document.createElement('td');
        dateCell.textContent = transaction.date; 

        coins_transaction_tbody.appendChild(rowForTransaction);

        rowForTransaction.append(nameCell, tickerCell, typeCell, amountCell, priceCell, valueCell, dateCell);
    });
}

// Funktion för att lägga till coin i portfolion
async function addCoinToPortfolio(coinId, name, ticker, price, change24hPercent) {

    // Anropa den nya funktionen för att kolla om coinet redan finns
    if (await isCoinInPortfolio(coinId)) {
        alert('Coin is already added to portfolio. Please adjust holdings instead.');
        return;
    }

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
        loadPortfolioCoins();
    } else {
        alert('Failed to add coin!');
    }
}

// Funktion för att kontrollera om ett coin redan finns i portfolion
async function isCoinInPortfolio(coinId) {
    const urlGet = `${api}/coins/portfolio`; // Hämta coins från portfolion
    const responseGet = await fetch(urlGet);
    
    // Kontrollera om requesten lyckades
    if (!responseGet.ok) {
        alert('Kunde inte hämta portfolion');
        return false; // Om det inte går att hämta, returnera false
    }

    const coins = await responseGet.json(); // Hämta JSON-objekt med coins

    // Returnera true om coinet finns, annars false
    return coins.some(c => c.coinId === coinId);
}

// Funktion för att ta bort ett coin från portfolion
async function removeCoinFromPortfolio(coinId) {
    const url = `${api}/coins/portfolio/${coinId}`; // Hämta fullständig URL

    // Skicka en DELETE-request
    const response = await fetch(url, {
        method: 'DELETE'
    });

    // Om requesten lyckades, ladda om coins
    if (response.ok) {
        loadPortfolioCoins();
    } else {
        alert('Failed to remove coin!');
    }
}

// Funktion för att justera holdings för ett coin i portfolion
async function adjustHoldings(coinId, coinAmountInput, currentHoldings, isBuy) {

    // Kontrollera att användaren har angett ett giltigt värde för holdings
    const amount = parseFloat(coinAmountInput.value);
    if (isNaN(amount) || amount <= 0) {
        alert('Ange ett giltigt värde för holdings');
        return;
    }

    let newHoldings = 0;

    if (isBuy) {
        newHoldings = currentHoldings + amount;
    } else {
        if (currentHoldings - amount < 0) {
            alert('Kan inte ta bort mer än vad du har');
            return;
        }
        newHoldings = currentHoldings - amount;
    }

    // Hämta coin från portfolio för att få hela objektet
    const coin = await getCoinFromPortfolio(coinId);

    if (!coin) {
        alert('Coin hittades inte');
        return;
    }

    // Uppdatera holdings
    coin.holdings = newHoldings;

    const urlPut = `${api}/coins/portfolio/${coinId}`;
    const responsePut = await fetch(urlPut, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(coin)
    });

    if (responsePut.ok) {

        // Spara transaktionen i databasen
        await addTransactionToCoinTransactions(coinId, coin.name, coin.ticker, isBuy ? 'Buy' : 'Sell', amount, coin.price, new Date().toISOString());

        // // Uppdatera UI:t med den nya transaktionen
        // addCoinTransaction(coinId, amount, isBuy);

        // Ladda om portfolion
        loadPortfolioCoins();
        loadCoinTransactions();
    } else {
        alert('Kunde inte uppdatera holdings');
    }
}

async function addTransactionToCoinTransactions(coinId, name, ticker, type, amount, price, date) {
    const url = api + '/coin-transactions'; // Hämta fullständig URL

    // Konvertera date till rätt format (yyyy-MM-ddTHH:mm:ss.fffZ)
    const formattedDate = new Date(date).toISOString();

    // Skapa JSON-objektet
    const transactionData = {
        CoinId: coinId.toString(),
        Name: name,
        Ticker: ticker,
        Type: type,
        CoinAmount: amount,
        CoinPrice: price,
        Date: formattedDate  // Använd det konverterade datumet
    };

    // Logga JSON-data för felsökning
    console.log("Sending transaction data:", JSON.stringify(transactionData));

    const response = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(transactionData)
    });

    if (response.ok) {
        loadCoinTransactions();
    } else {
        // Logga det fullständiga svaret för att få mer information om varför begäran misslyckades
        const errorDetails = await response.text();
        console.error("Failed to add transaction. Error details:", errorDetails);
        alert('Failed to add transaction!');
    }
}

// // Funktion som lägger till en transaktion i transaktionstabellen
// async function addCoinTransaction(coinId, coinAmount, isAdd) {

//     // Hämta senaste den sparade CoinGecko-datan för coinet
//     const coin = await getCoinFromPortfolio(coinId);

//     if (!coin) {
//         return;
//     }

//     // Skapa själva raden som transaktionen ska ligga i
//     const rowForTransaction = document.createElement('tr');

//     // Skapa celler och lagra värdena
//     const coinIdCell = document.createElement('td');
//     coinIdCell.textContent = coin.coinId; 

//     const nameCell = document.createElement('td');
//     nameCell.textContent = coin.name; 

//     const tickerCell = document.createElement('td');
//     tickerCell.textContent = coin.ticker;

//     const typeCell = document.createElement('td');
//     if (isAdd) { typeCell.textContent = 'Buy'; }
//     else { typeCell.textContent = 'Sell'; }

//     const coinAmountCell = document.createElement('td');
//     coinAmountCell.textContent = parseFloat(coinAmount);

//     const coinPriceCell = document.createElement('td');
//     coinPriceCell.textContent = '$' + parseFloat(coin.price).toLocaleString('en-US', 
//             { minimumFractionDigits: 0, maximumFractionDigits: 2 });

//     const valueCell = document.createElement('td');
//     valueCell.textContent = formatPrice(parseFloat(coinAmount * coin.price));

//     const dateCell = document.createElement('td');
//     dateCell.textContent = new Date().toLocaleString();

//     console.log(rowForTransaction)
//     coins_transaction_tbody.appendChild(rowForTransaction);
//     rowForTransaction.append(nameCell, tickerCell, typeCell, coinAmountCell, coinPriceCell, valueCell,  dateCell);


// }

// Funktion för att hämta ett coin från CoinGecko API baserat på coinId
async function getCoinFromCoinGecko(coinId) {
    const urlGet = `https://api.coingecko.com/api/v3/coins/${coinId}`;
    const responseGet = await fetch(urlGet);
    
    if (!responseGet.ok) {
        alert('Det gick inte att hämta coin från CoinGecko');
        return null; // Returnerar null om anropet misslyckas
    }

    const coin = await responseGet.json();

    if (!coin) {
        alert('Coin hittades inte');
        return null; // Returnerar null om inget coin hittades
    }

    return coin; // Returnerar coin om det hittades
}

// Funktion för att hämta ett coin från portfolion baserat på coinId
async function getCoinFromPortfolio(coinId) {
    const urlGet = `${api}/coins/portfolio`; // Hämta URL för att hämta coins från portfolion
    const responseGet = await fetch(urlGet); // Hämta data från URL
    const coins = await responseGet.json(); // Konvertera data till JSON
    const coin = coins.find(c => c.id === coinId); // Hitta coinet med rätt coinId

    if (!coin) {
        alert('Coin hittades inte');
        return null; // Returnerar null om inget coin hittades
    }

    return coin; // Returnerar coin om det hittades
}

////////////////////////////////////////////////////////////////////////////////////////////////////////
/// EXTRA FUNCTIONS ///
///////////////////////

// Funktion för att formatera priser
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

// Funktion för att filtrera coins i CoinGecko-tabellen baserat på användarens sökterm
function searchCoin() {
    const filter = inputSearchCoin.value.toLowerCase();
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

// Funktion för att returnera information beroende på vilket element användaren håller musen över
function showInfo(event) {
    const infoParagraph = document.getElementById('infoParagraph');
    
    let infoText = '';  // Variabel för att hålla texten som ska visas

    // Kontrollera vilket element musen är över och tilldela rätt information
    if (event.target.id === 'btnRefresh') {
        infoText = 'Refresh the tables with the latest data (possible once every minute).';
    } else if (event.target.id ==='inputSearchCoin') {
        infoText = 'Search for a coin by name or ticker symbol.';
    } else if (event.target.classList.contains('inputAmount')) {
        infoText = 'Enter an amount to adjust your holdings. Press + to increase and - to decrease.';
    } else if (event.target.classList.contains('btnIncrease')) {
        infoText = 'Add an amount of coins to your holdings..';
    } else if (event.target.classList.contains('btnDecrease')) {
        infoText = 'Remove an amount of coins from your holdings.';
    } else if (event.target.classList.contains('btnShowInfo')) {
        infoText = 'Show more information about this coin.';
    } else if (event.target.classList.contains('btnRemove')) {
        infoText = 'Remove this coin from your portfolio.';
    } else if (event.target.classList.contains('btnAddCoinToPortfolio')) {
        infoText = 'Add this coin to your portfolio.';
    } else {
        infoText = 'Det finns ingen info om detta element.';
    }

    // Sätt texten i paragrafen och visa den
    infoParagraph.textContent = infoText;
    infoParagraph.style.display = 'block'; // Visa paragrafen
}

// Funktion för att dölja informationen när musen lämnar ett element
function hideInfo() {
    const infoParagraph = document.getElementById('infoParagraph');
    infoParagraph.style.display = 'none'; // Dölj paragrafen
}

////////////////////////////////////////////////////////////////////////////////////////////////////////
/// EVENT LISTENERS ///
///////////////////////

// Keyup-event triggas varje gång användaren släpper en tangent,
// vilket gör att sökningen sker i realtid medan man skriver
inputSearchCoin.addEventListener('keyup', searchCoin);

// Uppdaterar tabellerna
btnRefresh.addEventListener('click', () => {
    loadCoinGeckoCoins().then(loadPortfolioCoins);
});

// Lägg till event listeners på element som ska trigga info-funktionen
document.querySelectorAll('#btnRefresh, #inputSearchCoin').forEach(element => {
    element.addEventListener('mouseover', showInfo); // Visa information när musen hovrar
    element.addEventListener('mouseout', hideInfo);  // Dölj information när musen lämnar
});

// Körs när sidan laddas
start();