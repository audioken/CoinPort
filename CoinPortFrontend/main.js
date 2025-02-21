////////////////////////////////////////////////////////////////////////////////////////////////////////
/// VARIABLES & ELEMENTS ///
////////////////////////////

// Lagra serverns adress i en variabel
const api = 'https://localhost:7026';

// Deklarera variabler för att lagra data
let coinGeckoData = {};
let isTotalsOn = true;
let isPortfolioOn = true;
let isTransactionsOn = true;
let isMarketOn = true;
let tempTotalValue = 0;
let tempTotalInvested = 0;
let tempTotalChange24h = 0;

// Hämta element från HTML
let labelTotals = document.getElementById('labelTotals'); // Hämta label för att visa totala värden
let labelPortfolio = document.getElementById('labelPortfolio'); // Hämta label för att visa portfolion
let labelTransactions = document.getElementById('labelTransactions'); // Hämta label för att visa transaktioner
let labelMarket = document.getElementById('labelMarket'); // Hämta label för att visa marknaden

let switchTotals = document.getElementById('switchTotals'); // Hämta switchen för att visa totala värden
let switchPortfolio = document.getElementById('switchPortfolio'); // Hämta switchen för att visa portfolion
let switchTransactions = document.getElementById('switchTransactions'); // Hämta switchen för att visa transaktioner
let switchMarket = document.getElementById('switchMarket'); // Hämta switchen för att visa marknaden

let totalValue = document.getElementById('totalValue'); // Hämta element för att visa totala portföljvärdet
let totalROIChange = document.getElementById('totalROIChange'); // Hämta element för att visa totala portföljförändringen
const inputSearchCoin = document.getElementById('inputSearchCoin');

// Hämta tbody-elementen från alla tabeller i HTML
const marketTableBody = document.getElementById('marketTableBody');
const portfolioTableBody = document.getElementById('portfolioTableBody');
const transactionsTableBody = document.getElementById('transactionsTableBody');

////////////////////////////////////////////////////////////////////////////////////////////////////////
/// MAIN FUNCTIONS ///
//////////////////////

// Starta sidan och hämta data från CoinGecko och API:et
function start() {
    getMarket()
        .then(getPortfolio)
        .then(getTransactions)
        .then(searchCoin);
}

// Hämta senaste marknadsdata för coins från CoinGecko och fyll i CoinGecko-tabellen
async function getMarket() {
    const url = api + '/market'; // Hämta fullständig URL
    const response = await fetch(url); // Hämta data från URL
    const coins = await response.json(); // Konvertera data till JSON

    marketTableBody.replaceChildren(); // Rensa tabellen

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

        const priceCell = document.createElement('td');
        priceCell.textContent = formatPrice(parseFloat(coin.price));

        const priceChange24hPercentCell = document.createElement('td');
        priceChange24hPercentCell.textContent = parseFloat(coin.priceChange24hPercent).toLocaleString('en-US', { minimumFractionDigits: 0, maximumFractionDigits: 2 }) + '%';
        priceChange24hPercentCell.style.color = getTrendColor(coin.priceChange24hPercent);
        priceCell.style.color = priceChange24hPercentCell.style.color;

        const marketCapCell = document.createElement('td');
        marketCapCell.textContent = '$' + parseFloat(coin.marketCap).toLocaleString('en-US');        
    
        // Skapa en cell för knappen som lägger till coinet i portfolion
        const actionCell = document.createElement('td');

        // Skapa knappen
        const btnAddCoinToPortfolio = document.createElement('button');
        btnAddCoinToPortfolio.classList.add('btnAddCoinToPortfolio');
        btnAddCoinToPortfolio.textContent = '➕';
    
        // Visa eller döljer info om vad knappen gör
        btnAddCoinToPortfolio.addEventListener('mouseover', showInfo); // Visa info när musen hovrar
        btnAddCoinToPortfolio.addEventListener('mouseout', hideInfo); // Dölj info när musen lämnar

        // Lägger till coinet i portfolion och sparar det i databasen
        btnAddCoinToPortfolio.onclick = () => addCoinToPortfolio(coin.coinId, coin.name, coin.ticker, coin.price, coin.priceChange24hPercent);
        
        // Lägger till alla celler i sina tillhörande HTML-element
        row.append(nameCell, tickerCell, priceCell, priceChange24hPercentCell, marketCapCell, actionCell);
        actionCell.appendChild(btnAddCoinToPortfolio);

        // Lägger till raden i tabellen
        marketTableBody.appendChild(row);
    });
    
}

// Hämta coins från API och fyll i portfolio-tabellen
async function getPortfolio() {

    // Hämta alla coins från portfolion
    const coins = await fetchPortfolioCoins();

    // Rensa tabellen för att undvika dubletter
    portfolioTableBody.replaceChildren();

    // Nollställ totala värden för att undvika att de adderas på varandra
    tempTotalValue = 0;
    tempTotalInvested = 0;
    tempTotalChange24h = 0;

    // Lägg till alla coins och dess värden i portfolion
    for (const coin of coins) {

        // Skapa raden för coinet
        const rowForCoin = document.createElement('tr');

        // Hämta den senaste CoinGecko-datan för coinet
        const geckoCoin = coinGeckoData[coin.coinId];

        // Uppdatera värden för coinet om det finns ny data
        const updatedCoinId = geckoCoin ? geckoCoin.coinId : coin.coinId;
        const updatedName = geckoCoin ? geckoCoin.name : coin.name;
        const updatedTicker = geckoCoin ? geckoCoin.ticker : coin.ticker;
        const updatedPrice = geckoCoin ? geckoCoin.price : coin.price;
        const updatedPriceChange24hPercent = geckoCoin ? geckoCoin.priceChange24hPercent : coin.priceChange24hPercent;
        const updatedPriceChange24h = geckoCoin ? geckoCoin.priceChange24h : coin.priceChange24h;

        // Räkna ut värden beräknade på senaste datan
        const invested = await calcuateInvestment(coin.coinId);
        
        const roiDollar = formatPrice(parseFloat((coin.holdings * updatedPrice) - invested));
        const roiPercent = parseFloat(((coin.holdings * updatedPrice) - invested) / invested * 100)
            .toLocaleString('en-US', { minimumFractionDigits: 0, maximumFractionDigits: 2 }) + '%';

        const price24hPercent = parseFloat(updatedPriceChange24hPercent).toLocaleString('en-US', { minimumFractionDigits: 0, maximumFractionDigits: 2 }) + '%';
        const price24hDollar = formatPrice(parseFloat((updatedPriceChange24h)));

        // Kolla om trenden är grön eller röd
        const isROIGreen = ((coin.holdings * updatedPrice) - invested) > 0;
        const isPrice24hChangeGreen = updatedPriceChange24hPercent > 0;

        // Skapa celler baserat på den senaste datan för varje värde i coin-objektet
        const coinIdCell = document.createElement('td');
        coinIdCell.textContent = updatedCoinId; 

        const nameCell = document.createElement('td');
        nameCell.textContent = updatedName; 

        const tickerCell = document.createElement('td');
        tickerCell.textContent = updatedTicker; 

        const priceCell = document.createElement('td');
        priceCell.textContent = formatPrice(parseFloat(updatedPrice));
            
        const change24hCell = document.createElement('td');
        const change24h = `${price24hDollar} \n ${price24hPercent}`;
        change24hCell.textContent = change24h;
        change24hCell.style.whiteSpace = 'pre-line'; 

        change24hCell.style.color = isPrice24hChangeGreen ? 'green' : 'red';
        priceCell.style.color = change24hCell.style.color;

        const holdingsCell = document.createElement('td');
        holdingsCell.textContent = coin.holdings; 

        const investedCell = document.createElement('td'); 
        investedCell.textContent = formatPrice(parseFloat(invested));

        const currentValueCell = document.createElement('td');
        currentValueCell.textContent = formatPrice(parseFloat(updatedPrice * coin.holdings)); 

        const roiCell = document.createElement('td');
        const roi = `${roiDollar} \n ${roiPercent}`;
        roiCell.textContent = roi;
        roiCell.style.whiteSpace = 'pre-line';

        roiCell.style.color = isROIGreen ? 'green' : 'red';
        currentValueCell.style.color = isROIGreen ? 'green' : 'red';

        // Skapa en cell för att hantera justering av holdings, 
        // samt knappar för att öka, minska, visa info och ta bort coinet
        const actionCell = document.createElement('td');

        // Skapa input-fält för att kunna justera holdings med (+) och (-)-knapparna  i 'actionCell'
        const inputAmount = document.createElement('input');
        inputAmount.classList.add('inputAmount');
        inputAmount.type = 'text';
        inputAmount.placeholder = 'Add transaction..';
        
        // Skapa en div-container för att hålla knapparna i 'actionCell'
        const btnBar = document.createElement('div');

        // Skapa knappar för att öka, minska, visa info och ta bort coinet från portfolion
        const btnIncreaseHolding = document.createElement('button'); 
        btnIncreaseHolding.classList.add('btnIncrease');
        btnIncreaseHolding.textContent = '➕';

        const btnDecreaseHolding = document.createElement('button');
        btnDecreaseHolding.classList.add('btnDecrease'); 
        btnDecreaseHolding.textContent = '➖';

        const btnShowCoinTransactions = document.createElement('button');
        btnShowCoinTransactions.classList.add('btnShowInfo');
        btnShowCoinTransactions.textContent = '🧾';

        const btnRemoveCoinFromPortfolio = document.createElement('button');
        btnRemoveCoinFromPortfolio.classList.add('btnRemove');
        btnRemoveCoinFromPortfolio.textContent = '❌';

        // Visa eller döljer info om vad elementen gör
        inputAmount.addEventListener('mouseover', showInfo);
        inputAmount.addEventListener('mouseout', hideInfo);

        btnIncreaseHolding.addEventListener('mouseover', showInfo); 
        btnIncreaseHolding.addEventListener('mouseout', hideInfo);

        btnDecreaseHolding.addEventListener('mouseover', showInfo); 
        btnDecreaseHolding.addEventListener('mouseout', hideInfo);

        btnShowCoinTransactions.addEventListener('mouseover', showInfo);
        btnShowCoinTransactions.addEventListener('mouseout', hideInfo); 

        btnRemoveCoinFromPortfolio.addEventListener('mouseover', showInfo); 
        btnRemoveCoinFromPortfolio.addEventListener('mouseout', hideInfo); 
        
        // Anropa funktioner baserat på vilken knapp som klickas
        btnIncreaseHolding.onclick = (event) => {
            event.preventDefault();
            adjustHoldings(coin.coinId, inputAmount, coin.holdings, true);
        };
        btnDecreaseHolding.onclick = (event) => {
            event.preventDefault();
            adjustHoldings(coin.coinId, inputAmount, coin.holdings, false);
        }
        btnShowCoinTransactions.onclick = (event) => {
            event.preventDefault();
            getCoinTransactions(coin.coinId);
        };
        btnRemoveCoinFromPortfolio.onclick = (event) => {
            event.preventDefault();
            deleteCoinFromPortfolio(coin.coinId, coin.holdings); 
        };

        // Lägger till alla celler i sina tillhörande HTML-element
        rowForCoin.append(nameCell, tickerCell, priceCell, change24hCell, holdingsCell, investedCell, currentValueCell, roiCell, actionCell);
        actionCell.append(inputAmount, btnBar);
        btnBar.append(btnIncreaseHolding, btnDecreaseHolding, btnShowCoinTransactions, btnRemoveCoinFromPortfolio);

        // Lägger till raden i tabellen
        portfolioTableBody.appendChild(rowForCoin);
        
        tempTotalValue += (updatedPrice * coin.holdings);
        tempTotalInvested += invested;
        tempTotalChange24h += updatedPriceChange24h * coin.holdings;
    };

    getPortfolioTotalValues(tempTotalValue, tempTotalInvested, tempTotalChange24h);
}

async function fetchPortfolioCoins(){

    // Hämta data från URL och konvertera till JSON
    const url = api + '/coins';
    const response = await fetch(url); 
    return await response.json();
}

// Hämta transaktioner för coins och fyll i transaktionstabellen
async function getTransactions() {
    const url = api + '/transactions';  // Hämta fullständig URL
    const response = await fetch(url); // Hämta data från URL

    if (!response.ok) {
        alert('Transaktioner hittades inte');
        return null;
    }

    const transactions = await response.json(); // Konvertera data till JSON

    renderTransactions(transactions);
}

// Funktion för att rendera (skapa och visa) transaktioner i transaktionstabellen
function renderTransactions(transactions) {
    transactionsTableBody.replaceChildren(); // Rensa tabellen

    // Loopa igenom alla coins och skapa en rad i tabellen för varje coin
    transactions.forEach(transaction => {

        // Skapa själva raden som transaktionen ska ligga i
        const rowForTransaction = document.createElement('tr');

        // Skapa celler med den uppdaterade datan för varje värde i transaction-objektet
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
        dateCell.textContent = formatDate(transaction.date); 

        const actionCell = document.createElement('td');
        const btnEditTransaction = document.createElement('button');
        btnEditTransaction.classList.add('btnEditTransaction');
        btnEditTransaction.textContent = '✏️';

        btnEditTransaction.onclick = () => editTransaction();

        // Lägger till alla celler i sina tillhörande HTML-element
        rowForTransaction.append(nameCell, tickerCell, typeCell, amountCell, priceCell, valueCell, dateCell, actionCell);
        
        // Lägger till knappen i actionCell
        actionCell.appendChild(btnEditTransaction);

        // Lägger till raden i tabellen
        transactionsTableBody.appendChild(rowForTransaction);
    });
}

async function editTransaction(){
    
}

// Funktion för att uppdatera totala värden och förändringar i portfolion
async function getPortfolioTotalValues(tempTotalValue, tempTotalInvested, tempTotalChange24h) {

    // Formatera totalt värde
    const totalValueFormated = formatPrice(parseFloat(tempTotalValue));

    // Beräkna och formatera ROI
    const totalPriceChangeFormated = formatPrice(parseFloat(tempTotalValue - tempTotalInvested));
    const totalPercentChangeFormated = parseFloat((tempTotalValue - tempTotalInvested) / tempTotalInvested * 100)
        .toLocaleString('en-US', { minimumFractionDigits: 0, maximumFractionDigits: 2 }) + '%';

    // Beräkna och formatera 24h förändring
    const total24hChangeFormated = formatPrice(parseFloat(tempTotalChange24h));
    const total24hPercentChangeFormated = parseFloat((tempTotalChange24h / (tempTotalValue - tempTotalChange24h)) * 100)
        .toLocaleString('en-US', { minimumFractionDigits: 0, maximumFractionDigits: 2 }) + '%';

    // Uppdatera totalt värde
    totalValue.textContent = totalValueFormated;

    // Uppdatera ROI
    totalROIChange.textContent = `${totalPriceChangeFormated} \n ${totalPercentChangeFormated}`;
    totalROIChange.style.whiteSpace = 'pre-line';
    totalROIChange.style.color = getTrendColor(tempTotalValue - tempTotalInvested);

    // Uppdatera 24h förändring
    total24hChange.textContent = `${total24hChangeFormated} \n ${total24hPercentChangeFormated}`;
    total24hChange.style.whiteSpace = 'pre-line';
    total24hChange.style.color = getTrendColor(tempTotalChange24h);
}

// Funktion för att lägga till coin i portfolion
async function addCoinToPortfolio(coinId, name, ticker, price, priceChange24h, priceChange24hPercent) {

    // Anropa den nya funktionen för att kolla om coinet redan finns
    if (await isCoinInPortfolio(coinId)) {
        alert('Coin is already added to portfolio. Please adjust holdings instead.');
        return;
    }

    const url = api + '/coins'; // Hämta fullständig URL

    // Skicka en POST-request med coinId, name, ticker, price, priceChange24hPercent och holdings
    const response = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' }, // Sätt header för att skicka JSON
        body: JSON.stringify({ // Konvertera objekt till JSON
            coinId: coinId,
            name: name,
            ticker: ticker,
            price: price,
            priceChange24hPercent: priceChange24hPercent,
            priceChange24h : priceChange24h,
            holdings: 0
        })
    });

    // Om requesten lyckades, ladda om coins
    if (response.ok) {
        getPortfolio();
    } else {
        alert('Failed to add coin!');
    }
}

// Funktion för att kontrollera om ett coin redan finns i portfolion 
async function isCoinInPortfolio(coinId) {
    const urlGet = `${api}/coins`; // Hämta coins från portfolion
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
async function deleteCoinFromPortfolio(coinId, coinHoldings) {
    const url = `${api}/coins/${coinId}`; // Hämta fullständig URL

    // Skicka en DELETE-request
    const response = await fetch(url, {
        method: 'DELETE'
    });

    // Om requesten lyckades, ladda om coins
    if (response.ok) {
        deleteAllCoinTransactions(coinId, coinHoldings);
        getPortfolio();
    } else {
        alert('Failed to remove coin!');
    }
}

// Funktion för att ta bort alla transaktioner för ett coin
async function deleteAllCoinTransactions(coinId, coinHoldings) {
    const url = `${api}/transactions/coin/${coinId}`;

    const response = await fetch(url, {
        method: 'DELETE'
    });

    if (response.ok) {
        getTransactions(); // Inte nödvändig, men för att se vad som händer efter borttagning
    } else {
        if (coinHoldings === 0) {
            return;
        }
        alert('Failed to remove transactions!');
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

    const urlPut = `${api}/coins/${coinId}`;
    const responsePut = await fetch(urlPut, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(coin)
    });

    if (responsePut.ok) {
        // Spara transaktionen i databasen
        await addTransactionToCoinTransactions(coinId, coin.name, coin.ticker, isBuy ? 'Buy' : 'Sell', amount, coin.price, new Date().toISOString());

        // Ladda om portfolion
        await getPortfolio();

        await getTransactions();

        // Återställ scrollpositionen
        window.scrollTo(0, scrollPosition);
    } else {
        alert('Kunde inte uppdatera holdings');
    }
}

// Funktion för att lägga till en transaktion i CoinTransactions-tabellen
async function addTransactionToCoinTransactions(coinId, name, ticker, type, amount, price, date) {
    const url = api + '/transactions'; // Hämta fullständig URL

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

    const response = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(transactionData)
    });

    if (response.ok) {
        getTransactions();
    } else {
        // Logga det fullständiga svaret för att få mer information om varför begäran misslyckades
        const errorDetails = await response.text();
        console.error("Failed to add transaction. Error details:", errorDetails);
        alert('Failed to add transaction!');
    }
}

// Funktion för att hämta ett coin från portfolion baserat på coinId
async function getCoinFromPortfolio(coinId) {
    const url = `${api}/coins/${coinId}`; // Hämta URL för att hämta coins från portfolion
    const response = await fetch(url); // Hämta data från URL

    if (!response.ok) {
        alert('Coin hittades inte');
        return null;
    }

    const coin = await response.json();

    return coin;
}

// Funktion för att hämta transaktioner för ett coin baserat på coinId
async function getCoinTransactions(coinId) {
    const url = `${api}/transactions/${coinId}`;
    const response = await fetch(url);

    if (!response.ok) {
        alert('Transaktioner hittades inte');
        return null;
    }

    const transactions = await response.json();

    renderTransactions(transactions);
}



////////////////////////////////////////////////////////////////////////////////////////////////////////
/// EXTRA FUNCTIONS ///
///////////////////////

// Funktion för att formatera priser
function formatPrice(value) {
    // Om värdet är extremt litet, visa med upp till 6 decimaler för att inte förlora små värden
    if (Math.abs(value) < 0.01) {
        // Ta bort extra nollor genom att använda toFixed(6) och ta bort slutförande nollor
        return `${value < 0 ? '-' : ''}$${Math.abs(value).toFixed(6).replace(/\.?0+$/, '')}`;
    } 
    
    // Annars formaterar vi med upp till 2 decimaler och lägger till dollartecken
    return `${value < 0 ? '-' : ''}$${Math.abs(value).toLocaleString('en-US', { minimumFractionDigits: 0, maximumFractionDigits: 2 })}`;
}

// Funktion för att formatera datum
function formatDate(dateString) {
    const options = { year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit', second: '2-digit' };
    const date = new Date(dateString);
    return date.toLocaleDateString('sv-SE', options).replace(' ', ' ');
}

// Funktion för att filtrera coins i CoinGecko-tabellen baserat på användarens sökterm
function searchCoin() {
    const filter = inputSearchCoin.value.toLowerCase();
    const rows = document.getElementById('marketTableBody').getElementsByTagName('tr');

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
        infoText = 'View coin transactions.';
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

// Funktion för att räkna ut total investering för ett coin
async function calcuateInvestment(coinId) {
    const url = `${api}/transactions/${coinId}`;
    const response = await fetch(url);

    if (!response.ok) {
        alert('Transaktioner hittades inte');
        return null;
    }

    const transactions = await response.json();

    let totalInvested = 0;

    transactions.forEach(transaction => {
        if (transaction.type === 'Buy') {
            totalInvested += transaction.coinAmount * transaction.coinPrice;
        } else {
            totalInvested -= transaction.coinAmount * transaction.coinPrice;
        }
    });

    return totalInvested;
}

// Funktion för att sätta färg på trenden beroende på om värdet är positivt, negativt eller noll
function getTrendColor(value){

    if (value > 0) {
        return 'green';
    } else if (value < 0) {
        return 'red';
    } else {
        return 'black';
    }
}

////////////////////////////////////////////////////////////////////////////////////////////////////////
/// EVENT LISTENERS ///
///////////////////////

// Keyup-event triggas varje gång användaren släpper en tangent,
// vilket gör att sökningen sker i realtid medan man skriver
inputSearchCoin.addEventListener('keyup', searchCoin);

// Lägg till event listeners på element som ska trigga info-funktionen
document.querySelectorAll('#inputSearchCoin').forEach(element => {
    element.addEventListener('mouseover', showInfo); // Visa information när musen hovrar
    element.addEventListener('mouseout', hideInfo);  // Dölj information när musen lämnar
});

function ShowHidePortfolio(isPortfolioOn) {
    labelPortfolio.style.color = isPortfolioOn ? 'black' : 'gray';
    const portfolio = document.querySelector('.portfolio');
    portfolio.style.display = isPortfolioOn ? 'block' : 'none';
}

switchPortfolio.addEventListener('click', () => {
    isPortfolioOn = !isPortfolioOn; 
    ShowHidePortfolio(isPortfolioOn);
});

function ShowHideTransactions(isTransactionsOn) {
    labelTransactions.style.color = isTransactionsOn ? 'black' : 'gray';
    const transactions = document.querySelector('.transactions');
    transactions.style.display = isTransactionsOn ? 'block' : 'none';
}

switchTransactions.addEventListener('click', () => {
    isTransactionsOn = !isTransactionsOn;
    ShowHideTransactions(isTransactionsOn);
});

function ShowHideMarket(isMarketOn) {
    labelMarket.style.color = isMarketOn ? 'black' : 'gray';
    const market = document.querySelector('.market');
    market.style.display = isMarketOn ? 'block' : 'none';
}

switchMarket.addEventListener('click', () => {
    isMarketOn = !isMarketOn;
    ShowHideMarket(isMarketOn);
});

function ShowHideTotals() {
    labelTotals.style.color = switchTotals.checked ? 'black' : 'gray';
    const totals = document.querySelector('.totals');
    totals.style.display = switchTotals.checked ? 'block' : 'none';
}

switchTotals.addEventListener('click', () => {
    isTotalsOn = !isTotalsOn;
    ShowHideTotals(isTotalsOn);
});

// Körs när sidan laddas
start();