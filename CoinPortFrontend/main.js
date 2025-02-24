////////////////////////////////////////////////////////////////////////////////////////////////////////
/// VARIABLES & ELEMENTS ///
////////////////////////////

// Lagra serverns adress i en variabel
const api = 'https://localhost:7026';

// Deklarera variabler för att lagra data
let marketData = {};
let isTotalsOn = true;
let isPortfolioOn = true;
let isTransactionsOn = true;
let isMarketOn = true;
let tempTotalValue = 0;
let tempTotalInvested = 0;
let tempTotalChange24h = 0;

// Hämta element från HTML
let tableTitleTextTotals = document.getElementById('tableTitleTextTotals'); // Hämta label för att visa totala värden
let tableTitleTextPortfolio = document.getElementById('tableTitleTextPortfolio'); // Hämta label för att visa portfolion
let tableTitleTextTransactions = document.getElementById('tableTitleTextTransactions'); // Hämta label för att visa transaktioner
let tableTitleTextMarket = document.getElementById('tableTitleTextMarket'); // Hämta label för att visa marknaden

let switchTotals = document.getElementById('switchTotals'); // Hämta switchen för att visa totala värden
let switchPortfolio = document.getElementById('switchPortfolio'); // Hämta switchen för att visa portfolion
let switchTransactions = document.getElementById('switchTransactions'); // Hämta switchen för att visa transaktioner
let switchMarket = document.getElementById('switchMarket'); // Hämta switchen för att visa marknaden

const inputSearchCoin = document.getElementById('inputSearchCoin');

// Hämta tbody-elementen från alla tabeller i HTML
const tableBodyTotals = document.getElementById('tableBodyTotals');
const tableBodyMarket = document.getElementById('tableBodyMarket');
const tableBodyPortfolio = document.getElementById('tableBodyPortfolio');
const tableBodyTransactions = document.getElementById('tableBodyTransactions');

////////////////////////////////////////////////////////////////////////////////////////////////////////
/// MAIN FUNCTIONS ///
//////////////////////

// Starta sidan och hämta data från CoinGecko och API:et
function start() {
    getMarket()
        .then(getTransactions)
        .then(createPortfolio)
        .then(searchCoin);
}

// Hämta senaste marknadsdata för coins
async function getMarket() {
    const url = api + '/market'; // Hämta fullständig URL
    const response = await fetch(url); // Hämta data från URL
    const coins = await response.json(); // Konvertera data till JSON

    tableBodyMarket.replaceChildren(); // Rensa tabellen

    marketData = {}; // Nollställ minnet av CoinGecko-data

    coins.forEach(coin => {
        marketData[coin.coinId] = coin; // Spara coinet med coinId som nyckel
        
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

        const priceChange24h = coin.priceChange24h !== null && !isNaN(parseFloat(coin.priceChange24h)) ? parseFloat(coin.priceChange24h) : 0;

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
        btnAddCoinToPortfolio.onclick = () => addCoin(coin.coinId, coin.name, coin.ticker, 'Add', 0, 0, Date.now());
        
        // Lägger till alla celler i sina tillhörande HTML-element
        row.append(nameCell, tickerCell, priceCell, priceChange24hPercentCell, marketCapCell, actionCell);
        actionCell.appendChild(btnAddCoinToPortfolio);

        // Lägger till raden i tabellen
        tableBodyMarket.appendChild(row);
    });
    
}

// Lägg till ett coin i portfolion
async function addCoin(coinId, name, ticker, type, amount, price, date) {
    const url = api + '/transactions'; // Hämta fullständig URL

    const transactions = await fetchTransactions();
    const isAlreadyAdded = transactions.some(t => t.coinId === coinId);

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

    if (!isAlreadyAdded) {
        const response = await fetch(url, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(transactionData)
        });

        if (response.ok) {
            getTransactions();
            createPortfolio();
        } else {
            // Logga det fullständiga svaret för att få mer information om varför begäran misslyckades
            const errorDetails = await response.text();
            console.error("Failed to add transaction. Error details:", errorDetails);
            alert('Failed to add transaction!');
        }
    } else {
        alert('Coin already added to portfolio');
        return;
    }
}

// Skapa portfolion baserat på transaktioner
async function createPortfolio(){
    const transactions = await fetchTransactions();
    const coins = await sortCoins(transactions);
    await renderPortfolio(coins);
}

// Hämta transaktioner från databasen
async function fetchTransactions(){
    const url = api + '/transactions';
    const response = await fetch(url);

    if (!response.ok) {
        alert('Transaktioner hittades inte');
        return null;
    }

    return await response.json();
}

// Sortera coins baserat på transaktioner
async function sortCoins(transactions) {
    const coins = [];

    for (const transaction of transactions) {
        let coin = coins.find(c => c.coinId === transaction.coinId);

        if (!coin) {
            coin = {
                coinId: transaction.coinId,
                name: transaction.name,
                ticker: transaction.ticker,
                price: transaction.coinPrice,
                priceChange24hPercent: 0,
                priceChange24h: 0,
                holdings: 0
            };
            coins.push(coin);
        }

        // Uppdatera holdings baserat på transaktionstyp
        if (transaction.type === "Buy") {
            coin.holdings += transaction.coinAmount;
        } else if (transaction.type === "Sell") {
            coin.holdings -= transaction.coinAmount;
        }
    }

    return coins;
}

// Rendera portfolion
async function renderPortfolio(coins){

    // Rensa tabellen för att undvika dubletter
    tableBodyPortfolio.replaceChildren();

    // Nollställ totala värden för att undvika att de adderas på varandra
    tempTotalValue = 0;
    tempTotalInvested = 0;
    tempTotalChange24h = 0;

    // Lägg till alla coins och dess värden i portfolion
    for (const coin of coins) {

        // Skapa raden för coinet
        const rowForCoin = document.createElement('tr');

        // Hämta den senaste CoinGecko-datan för coinet
        const marketCoin = marketData[coin.coinId];

        // Uppdatera värden för coinet om det finns ny data
        const updatedCoinId = marketCoin ? marketCoin.coinId : coin.coinId;
        const updatedName = marketCoin ? marketCoin.name : coin.name;
        const updatedTicker = marketCoin ? marketCoin.ticker : coin.ticker;
        const updatedPrice = marketCoin ? marketCoin.price : coin.price;
        const updatedPriceChange24hPercent = marketCoin ? marketCoin.priceChange24hPercent : coin.priceChange24hPercent;
        const updatedPriceChange24h = marketCoin ? marketCoin.priceChange24h : coin.priceChange24h;

        // Räkna ut värden beräknade på senaste datan
        const invested = await calcuateInvestment(coin.coinId);
        const holdings = await calculateHoldings(coin.coinId);

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
        holdingsCell.textContent = holdings; 

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
            buyOrSell(marketCoin, inputAmount, true);
        };
        btnDecreaseHolding.onclick = (event) => {
            event.preventDefault();
            buyOrSell(marketCoin, inputAmount, false);
        }
        btnShowCoinTransactions.onclick = (event) => {
            event.preventDefault();
            getCoinTransactions(coin.coinId);
        };
        btnRemoveCoinFromPortfolio.onclick = (event) => {
            event.preventDefault();
            deleteCoin(coin.coinId);
        };

        // Lägger till alla celler i sina tillhörande HTML-element
        rowForCoin.append(nameCell, tickerCell, priceCell, change24hCell, holdingsCell, investedCell, currentValueCell, roiCell, actionCell);
        actionCell.append(inputAmount, btnBar);
        btnBar.append(btnIncreaseHolding, btnDecreaseHolding, btnShowCoinTransactions, btnRemoveCoinFromPortfolio);

        // Lägger till raden i tabellen
        tableBodyPortfolio.appendChild(rowForCoin);
        
        tempTotalValue += (updatedPrice * coin.holdings);
        tempTotalInvested += invested;
        tempTotalChange24h += updatedPriceChange24h * coin.holdings;
    };

    generateTotalValues(tempTotalValue, tempTotalInvested, tempTotalChange24h);
}

// Köp eller sälj ett coin
async function buyOrSell(coin, coinAmountInput, isBuy) {

    const amount = parseFloat(coinAmountInput.value.replace(',', '.'));


    if (isNaN(amount) || amount <= 0) {
        alert('Ange ett giltigt värde för holdings');
        return;
    }

    await addTransaction(coin.coinId, coin.name, coin.ticker, isBuy ? 'Buy' : 'Sell', amount, coin.price, new Date().toISOString());
    await createPortfolio();
}

// Lägg till en transaktion i databasen
async function addTransaction(coinId, name, ticker, type, amount, price, date) {
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

// Hämta transaktioner från databasen
async function getTransactions() {
    const transactions = await fetchTransactions();
    renderTransactions(transactions);
}

// Rendera transaktioner
async function renderTransactions(transactions) {
    tableBodyTransactions.replaceChildren(); // Rensa tabellen

    // Loopa igenom alla coins och skapa en rad i tabellen för varje coin
    transactions.forEach(transaction => {

        // Skapa själva raden som transaktionen ska ligga i
        const row = document.createElement('tr');

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
        priceCell.textContent = formatPrice(parseFloat(transaction.coinPrice));
        
        const valueCell = document.createElement('td');
        valueCell.textContent = formatPrice(parseFloat(transaction.coinPrice * transaction.coinAmount)); 

        const dateCell = document.createElement('td');
        dateCell.textContent = formatDate(transaction.date); 

        const actionCell = document.createElement('td');

        if (transaction.type != 'Add') {

            if (transaction.type === 'Buy') {
                row.style.color = 'green';
            } else {
                row.style.color = 'red';
            }
     
            const btnEditTransaction = document.createElement('button');
            btnEditTransaction.classList.add('btnEditTransaction');
            btnEditTransaction.textContent = '✏️';
            btnEditTransaction.onclick = () => { 
                editTransaction(
                    btnEditTransaction, 
                    btnUpdateTransaction, 
                    amountCell, 
                    priceCell);
            };

            const btnUpdateTransaction = document.createElement('button');
            btnUpdateTransaction.classList.add('btnApplyChanges');
            btnUpdateTransaction.textContent = '✔️';
            btnUpdateTransaction.style.display = 'none';
            btnUpdateTransaction.onclick = () => {
                saveChanges(
                    btnUpdateTransaction, 
                    btnEditTransaction, 
                    amountCell, priceCell, 
                    transaction.id);
                updateTransaction(
                    transaction.id, 
                    transaction.coinId,
                    transaction.name,
                    transaction.ticker,
                    transaction.type,
                    amountCell.textContent,
                    priceCell.textContent,
                    transaction.date);
            };

            const btnDeleteTransaction = document.createElement('button');
            btnDeleteTransaction.classList.add('btnDeleteTransaction');
            btnDeleteTransaction.textContent = '❌';
            btnDeleteTransaction.onclick = () => deleteTransaction(transaction.id);

            // Lägger till knappen i actionCell
            actionCell.append(btnEditTransaction, btnUpdateTransaction, btnDeleteTransaction);
        } else{

            // Dölj raden för 'Add'-transaktioner
            row.style.visibility = 'collapse';
        }

        // Lägger till alla celler i sina tillhörande HTML-element
        row.append(nameCell, tickerCell, typeCell, amountCell, priceCell, valueCell, dateCell, actionCell);

        // Lägger till raden i tabellen
        tableBodyTransactions.appendChild(row);
    });
}

// Ta bort ett coin från portfolion
async function deleteCoin(coinId) {
    const transactions = await fetchTransactions();

    for (const transaction of transactions) {
        if (transaction.coinId === coinId) {
            await deleteTransaction(transaction.id);
        }
    }
}

// Redigera en transaktion
async function editTransaction(btnEdit, btnUpdate, amountCell, priceCell) {

    // Visa eller dölj knappar
    btnEdit.style.display = 'none'; 
    btnUpdate.style.display = 'inline-block';

    // Ändra bakgrundsfärg för att visa att raden är redigerbar
    amountCell.style.backgroundColor = 'salmon'; 
    priceCell.style.backgroundColor = 'salmon'; 

    // Gör cellerna redigerbara
    amountCell.contentEditable = true; 
    priceCell.contentEditable = true;
    
    // Markera all text i cellen
    markAllText(amountCell); 
}

// Markera all text i en cell
async function markAllText(cell){

    // Fokusera cellen
    cell.focus();
    
    // Markera all text i cellen
    const range = document.createRange();
    const selection = window.getSelection();
    range.selectNodeContents(cell);
    selection.removeAllRanges();
    selection.addRange(range);
}

// Uppdatera en transaktion
async function saveChanges(btnUpdate, btnEdit, amountCell, priceCell) {
    
    // Göm eller visa knappar
    btnUpdate.style.display = 'none'; 
    btnEdit.style.display = 'inline-block';

    // Återställ bakgrundsfärg
    amountCell.style.backgroundColor = ''; 
    priceCell.style.backgroundColor = ''; 

    // Gör celler oredigerbara
    amountCell.contentEditable = false; 
    priceCell.contentEditable = false;

    // Ta bort fokus från cellerna
    amountCell.isFocused = false; 
    priceCell.isFocused = false; 

    // Avmarkera all text
    const selection = window.getSelection();
    selection.removeAllRanges(); // Tar bort markeringen
}

async function updateTransaction(id, coinId, name, ticker, type, amount, price, date) {

    // Sanera amount och price innan du skickar dem
    const sanitizedAmount = amount.replace(',', '.');  // Byt komma till punkt
    const sanitizedPrice = price.replace('$', '').replace(',', '.');  // Ta bort $ och byt komma till punkt

    const transactionData = {
        CoinId: coinId,
        Name: name,
        Ticker: ticker,
        Type: type,
        CoinAmount: sanitizedAmount,
        CoinPrice: sanitizedPrice,
        Date: date
    };

    const url = `${api}/transactions/${id}`;
    const response = await fetch(url, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(transactionData)
    });

    if (!response.ok) {
        alert('Failed to update transaction');
        return;
    }

    getTransactions();
    createPortfolio();
}

// Ta bort en transaktion från databasen
async function deleteTransaction(id) {
    
    const url = `${api}/transactions/${id}`;
    const response = await fetch(url, {
        method: 'DELETE'
    });

    if (!response.ok) {
        alert('Failed to delete transaction');
        return;
    }

    // Uppdatera portfolion efter att transaktionen tagits bort
    await getTransactions();
    await createPortfolio();
}

// Generera totala värden för portfolion
async function generateTotalValues(tempTotalValue, tempTotalInvested, tempTotalChange24h) {

    // Rensa tabellen för att undvika dubletter
    tableBodyTotals.replaceChildren();

    // Formatera totalt värde
    const totalValueFormated = formatPrice(parseFloat(tempTotalValue));
    
    // Beräkna och formatera 24h förändring
    const total24hChangeFormated = formatPrice(parseFloat(tempTotalChange24h));
    const total24hPercentChangeFormated = parseFloat((tempTotalChange24h / (tempTotalValue - tempTotalChange24h)) * 100)
        .toLocaleString('en-US', { minimumFractionDigits: 0, maximumFractionDigits: 2 }) + '%';

    // Beräkna och formatera ROI
    const totalPriceChangeFormated = formatPrice(parseFloat(tempTotalValue - tempTotalInvested));
    const totalPercentChangeFormated = parseFloat((tempTotalValue - tempTotalInvested) / tempTotalInvested * 100)
        .toLocaleString('en-US', { minimumFractionDigits: 0, maximumFractionDigits: 2 }) + '%';

    // Skapa en rad för totala värden
    const rowForTotal = document.createElement('tr');

    // Uppdatera totalt värde
    const totalValueCell = document.createElement('td');
    totalValueCell.classList.add('cellTotal');
    totalValueCell.textContent = totalValueFormated;

    // Uppdatera 24h förändring
    const _24hChangeCell = document.createElement('td');
    _24hChangeCell.classList.add('cell24h');
    _24hChangeCell.textContent = `${total24hChangeFormated} \n ${total24hPercentChangeFormated}`;
    _24hChangeCell.style.whiteSpace = 'pre-line';
    _24hChangeCell.style.color = getTrendColor(tempTotalChange24h);

    // Uppdatera ROI
    const roiChangeCell = document.createElement('td');
    roiChangeCell.classList.add('cellROI');
    roiChangeCell.textContent = `${totalPriceChangeFormated} \n ${totalPercentChangeFormated}`;
    roiChangeCell.style.whiteSpace = 'pre-line';
    roiChangeCell.style.color = getTrendColor(tempTotalValue - tempTotalInvested);

    // Lägg till cellerna i raden
    rowForTotal.append(totalValueCell, _24hChangeCell, roiChangeCell);

    // Lägg till raden i tabellen
    tableBodyTotals.appendChild(rowForTotal);
}

// Hämta transaktioner för ett coin
async function getCoinTransactions(coinId) {
    const url = `${api}/transactions/coin/${coinId}`;
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
        return `${value < 0 ? '-' : ''}$${Math.abs(value).toFixed(8).replace(/\.?0+$/, '')}`;
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
    const url = `${api}/transactions/coin/${coinId}`;
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

async function calculateHoldings(coinId) {
    const url = `${api}/transactions/coin/${coinId}`;
    const response = await fetch(url);

    if (!response.ok) {
        alert('Transaktioner hittades inte');
        return null;
    }

    const transactions = await response.json();

    let totalHoldings = 0;

    transactions.forEach(transaction => {

        if (transaction.type === 'Buy') {
            totalHoldings += transaction.coinAmount;
        } else {
            totalHoldings -= transaction.coinAmount;
        }
    });

    return totalHoldings;
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
    tableTitleTextPortfolio.style.color = isPortfolioOn ? 'black' : 'gray';
    const tablePortfolioContainer = document.querySelector('.tablePortfolioContainer');
    tablePortfolioContainer.style.display = isPortfolioOn ? 'block' : 'none';
}

switchPortfolio.addEventListener('click', () => {
    isPortfolioOn = !isPortfolioOn; 
    ShowHidePortfolio(isPortfolioOn);
});

function ShowHideTransactions(isTransactionsOn) {
    tableTitleTextTransactions.style.color = isTransactionsOn ? 'black' : 'gray';
    const tableTransactionsContainer = document.querySelector('.tableTransactionsContainer');
    tableTransactionsContainer.style.display = isTransactionsOn ? 'block' : 'none';
}

switchTransactions.addEventListener('click', () => {
    isTransactionsOn = !isTransactionsOn;
    ShowHideTransactions(isTransactionsOn);
});

function ShowHideMarket(isMarketOn) {
    tableTitleTextMarket.style.color = isMarketOn ? 'black' : 'gray';
    const tableMarketContainer = document.querySelector('.tableMarketContainer');
    tableMarketContainer.style.display = isMarketOn ? 'block' : 'none';
}

switchMarket.addEventListener('click', () => {
    isMarketOn = !isMarketOn;
    ShowHideMarket(isMarketOn);
});

function ShowHideTotals() {
    tableTitleTextTotals.style.color = switchTotals.checked ? 'black' : 'gray';
    const tableTotalsContainer = document.querySelector('.tableTotalsContainer');
    tableTotalsContainer.style.display = switchTotals.checked ? 'block' : 'none';
}

switchTotals.addEventListener('click', () => {
    isTotalsOn = !isTotalsOn;
    ShowHideTotals(isTotalsOn);
});

// Körs när sidan laddas
start();