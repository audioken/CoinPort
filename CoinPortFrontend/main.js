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
let activeEdit = null;

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

document.querySelector('.sortMarketCap').classList.add('active');

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

        const rankCell = document.createElement('td');
        rankCell.textContent = coin.rank;

        const img = document.createElement('img');
        img.src = coin.image;
        img.width = 25;
        img.height = 25;

        const nameCell = document.createElement('td');
        const nameCellText = document.createTextNode(coin.name); // Skapa en textnod

        nameCell.appendChild(img);  // Lägg först till bilden
        nameCell.appendChild(nameCellText);  // Lägg sedan till texten
    
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
        btnAddCoinToPortfolio.style.fontSize = "15px";
    
        // Visa eller döljer info om vad knappen gör
        btnAddCoinToPortfolio.addEventListener('mouseover', showInfo); // Visa info när musen hovrar
        btnAddCoinToPortfolio.addEventListener('mouseout', hideInfo); // Dölj info när musen lämnar

        // Lägger till coinet i portfolion och sparar det i databasen
        btnAddCoinToPortfolio.onclick = () => addCoin(coin.coinId, coin.name, coin.ticker, 'Add', 0, 0, Date.now());
        
        // Lägger till alla celler i sina tillhörande HTML-element
        row.append(rankCell, nameCell, tickerCell, priceCell, priceChange24hPercentCell, marketCapCell, actionCell);
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
        let invested = await calcuateInvestment(coin.coinId);
        const holdings = await calculateHoldings(coin.coinId);

        if (invested < 0){
            invested = 0;
        }

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

        const img = document.createElement('img');
        img.src = marketCoin.image;
        img.width = 25;
        img.height = 25;

        const nameCell = document.createElement('td');
        nameCellText = document.createTextNode(updatedName);
        // nameCell.textContent = updatedName; 

        nameCell.appendChild(img);
        nameCell.appendChild(nameCellText);

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

        if (invested <= 0) {
            investedCell.textContent = "Breakeven";
        } else{
            investedCell.textContent = formatPrice(parseFloat(invested));
        }

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
        btnIncreaseHolding.style.fontSize = "15px";

        const btnDecreaseHolding = document.createElement('button');
        btnDecreaseHolding.classList.add('btnDecrease'); 
        btnDecreaseHolding.textContent = '➖';
        btnDecreaseHolding.style.fontSize = "15px";

        const btnShowCoinTransactions = document.createElement('button');
        btnShowCoinTransactions.classList.add('btnShowInfo');
        btnShowCoinTransactions.textContent = '💱';
        btnShowCoinTransactions.style.fontSize = "15px";

        const btnRemoveCoinFromPortfolio = document.createElement('button');
        btnRemoveCoinFromPortfolio.classList.add('btnRemove');
        btnRemoveCoinFromPortfolio.textContent = '✘';
        btnRemoveCoinFromPortfolio.style.color = 'red';
        btnRemoveCoinFromPortfolio.style.fontSize = "15px";
        btnRemoveCoinFromPortfolio.style.fontWeight = "bold";

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
        alert('Invalid amount');
        return;
    }

    if (!isBuy){
        let isAmountValid = await validateAmount(coinAmountInput.value, coin.coinId);
        if (isAmountValid === false) { return; }
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
        await getTransactions();
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
    await renderTransactions(transactions);
}

// Rendera transaktioner
async function renderTransactions(transactions) {
    tableBodyTransactions.replaceChildren(); // Rensa tabellen

    // Loopa igenom alla coins och skapa en rad i tabellen för varje coin
    for (const transaction of transactions) {

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
            btnEditTransaction.style.fontSize = "15px";
            btnEditTransaction.onclick = () => {    
                cancelOtherEdits();
                editTransaction(
                    btnEditTransaction, 
                    btnUpdateTransaction,
                    btnRestoreChanges,
                    btnDeleteTransaction, 
                    amountCell, 
                    priceCell
                );

                // Pågående redigering
                activeEdit = [
                    btnEditTransaction, 
                    btnUpdateTransaction, 
                    btnRestoreChanges, 
                    btnDeleteTransaction, 
                    amountCell, 
                    priceCell, 
                    transaction.coinAmount, 
                    transaction.coinPrice
                ];
            };

            let isNumbersValid = false;
            let isAmountValid = false;
            const btnUpdateTransaction = document.createElement('button');
            btnUpdateTransaction.classList.add('btnApplyChanges');
            btnUpdateTransaction.textContent = '✓';
            btnUpdateTransaction.style.color = 'green';
            btnUpdateTransaction.style.fontSize = "15px";
            btnUpdateTransaction.style.fontWeight = "bold";
            btnUpdateTransaction.style.display = 'none';
            btnUpdateTransaction.onclick = async () => {

                isNumbersValid = await validateNumbers(amountCell.textContent, priceCell.textContent);

                if (transaction.type === 'Buy') { 
                    isAmountValid = await validateAmount((transaction.coinAmount - amountCell.textContent), transaction.coinId); 
                } else { 
                    isAmountValid = await validateAmount((amountCell.textContent - transaction.coinAmount), transaction.coinId); 
                }

                if (isNumbersValid === true && isAmountValid === true) {

                    restoreButtonsAndCells(
                        btnEditTransaction, 
                        btnUpdateTransaction, 
                        amountCell, 
                        priceCell, 
                        transaction.id
                    );

                    updateTransaction(
                        transaction.id, 
                        transaction.coinId,
                        transaction.name,
                        transaction.ticker,
                        transaction.type,
                        amountCell.textContent,
                        priceCell.textContent,
                        transaction.date
                    );
                }

                // Ingen redigering pågår längre
                activeEdit = null;
            };

            const btnRestoreChanges = document.createElement('button');
            btnRestoreChanges.classList.add('btnCancelChanges');
            btnRestoreChanges.textContent = '✘';
            btnRestoreChanges.style.color = 'green';
            btnRestoreChanges.style.fontSize = "15px";
            btnRestoreChanges.style.fontWeight = "bold";
            btnRestoreChanges.style.display = 'none';
            btnRestoreChanges.onclick = () => {
                restoreChanges(
                    btnEditTransaction, 
                    btnUpdateTransaction,
                    btnRestoreChanges,
                    btnDeleteTransaction, 
                    amountCell,
                    priceCell,
                    transaction.coinAmount, 
                    transaction.coinPrice
                );

                // Ingen redigering pågår längre
                activeEdit = null;
            };

            const btnDeleteTransaction = document.createElement('button');
            btnDeleteTransaction.classList.add('btnDeleteTransaction');
            btnDeleteTransaction.textContent = '✘';
            btnDeleteTransaction.style.color = 'red';
            btnDeleteTransaction.style.fontSize = "15px";
            btnDeleteTransaction.style.fontWeight = "bold";

            btnDeleteTransaction.onclick = async () => {
                
                if (transaction.type === 'Buy') {

                    isAmountValid = await validateAmount(transaction.coinAmount, transaction.coinId); 

                    if (isAmountValid === true) { deleteTransaction(transaction.id, true); }

                } else{ deleteTransaction(transaction.id, true); }
            };

            // Lägger till knappen i actionCell
            actionCell.append(btnEditTransaction, btnUpdateTransaction, btnRestoreChanges, btnDeleteTransaction);
        } else{

            // Dölj raden för 'Add'-transaktioner
            row.style.visibility = 'collapse';
        }

        // Lägger till alla celler i sina tillhörande HTML-element
        row.append(nameCell, tickerCell, typeCell, amountCell, priceCell, valueCell, dateCell, actionCell);

        // Lägger till raden i tabellen
        tableBodyTransactions.appendChild(row);
    };
}

// Validera att inmatade värden är giltiga
async function validateAmount(amount, coinId) {  
    
    const holdings = await calculateHoldings(coinId);

    if (amount > holdings) {
        alert('Amount is too high. Cannot sell more than you own.');
        return false;
    } else {
        return true;
    }
}

// Avbryt pågående redigering
async function cancelOtherEdits() {
    if (activeEdit) {
        restoreChanges(...activeEdit);
        activeEdit = null;
    }
}

// Återställ ändringar i en transaktion
async function restoreChanges(btnEdit, btnUpdate, btnRestore, btnDelete, amountCell, priceCell, amount, price) {
    btnUpdate.style.display = 'none'; 
    btnEdit.style.display = 'inline-block';
    btnRestore.style.display = 'none';
    btnDelete.style.display = 'inline-block';

    amountCell.style.backgroundColor = ''; 
    priceCell.style.backgroundColor = ''; 

    amountCell.textContent = amount;
    priceCell.textContent = '$' + price;

    amountCell.contentEditable = false; 
    priceCell.contentEditable = false;

    const selection = window.getSelection();
    selection.removeAllRanges(); 

}

// Ta bort ett coin från portfolion
async function deleteCoin(coinId) {
    const transactions = await fetchTransactions();

    for (const transaction of transactions) {
        if (transaction.coinId === coinId) {
            await deleteTransaction(transaction.id, false);
        }
    }

    // Uppdatera portfolion efter att transaktionerna tagits bort
    await getTransactions();
    await createPortfolio();
}

// Redigera en transaktion
async function editTransaction(btnEdit, btnUpdate, btnRestore, btnDelete, amountCell, priceCell) {

    // Visa eller dölj knappar
    btnEdit.style.display = 'none'; 
    btnUpdate.style.display = 'inline-block';
    btnRestore.style.display = 'inline-block';
    btnDelete.style.display = 'none';

    // Ändra bakgrundsfärg för att visa att raden är redigerbar
    amountCell.style.backgroundColor = '#FFDAB9'; 
    priceCell.style.backgroundColor = '#FFDAB9'; 

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

// Återställ celler och knappar efter att ändringar har sparats
async function restoreButtonsAndCells(btnEdit, btnUpdate, amountCell, priceCell) {
    
    // Göm eller visa knappar
    btnEdit.style.display = 'inline-block';
    btnUpdate.style.display = 'none'; 

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

// Uppdatera en transaktion i databasen
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
async function deleteTransaction(id, deletingSingleTransaction) {
    
    const url = `${api}/transactions/${id}`;
    const response = await fetch(url, {
        method: 'DELETE'
    });

    if (!response.ok) {
        alert('Failed to delete transaction');
        return;
    }

    // Uppdatera om det är en enskild transaktion som tas bort
    if (deletingSingleTransaction === true) {
        getTransactions();
        createPortfolio();
    }
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
    if (Math.abs(value) < 0.0001) {
        return `${value < 0 ? '-' : ''}$${Math.abs(value).toFixed(10).replace(/\.?0+$/, '')}`;
    } else if (Math.abs(value) < 0.01) {
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
    const searchInput = inputSearchCoin.value.toLowerCase();
    const rows = document.querySelectorAll('#tableBodyMarket tr');

    rows.forEach(row => {
        const coinName = row.querySelector('td:nth-child(2)').textContent.toLowerCase();
        const coinTicker = row.querySelector('td:nth-child(3)').textContent.toLowerCase();
        if (coinName.includes(searchInput) || coinTicker.includes(searchInput)) {
            row.style.display = '';
        } else {
            row.style.display = 'none';
        }
    });
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

async function validateNumbers(amount, price){

    const sanitizedAmount = sanitizeAndConvert(amount);
    const sanitizedPrice = sanitizeAndConvert(price);

    if (isNaN(sanitizedAmount) || isNaN(sanitizedPrice) || 
        sanitizedAmount <= 0 || sanitizedPrice <= 0) {
        alert('Ange giltiga värden..');
        return false;
    } else {
        return true;
    }
}

// Funktion för att sanera och konvertera cellvärden till nummer
function sanitizeAndConvert(value) {

    // Kontrollera om värdet matchar datumformatet YYYY-MM-DD HH:MM:SS
    const dateMatch = value.match(/^(\d{4})-(\d{2})-(\d{2}) (\d{2}):(\d{2}):(\d{2})$/);

    if (dateMatch) {
        return new Date(value).getTime(); // Konvertera till tidsstämpel i millisekunder
    }

    // Ta bort alla icke-numeriska tecken förutom punkt och minus
    const sanitizedValue = value.replace(/[^0-9.-]+/g, "");
    return parseFloat(sanitizedValue);
}

// Funktion för att sortera tabeller
function sortTable(columnIndex, order, tableClass) {
    
    const table = document.querySelector(`.${tableClass}`);
    const tbody = table.querySelector('tbody');
    const rows = Array.from(tbody.querySelectorAll('tr'));

    rows.sort((a, b) => {
        let cellA = a.children[columnIndex].textContent.trim();
        let cellB = b.children[columnIndex].textContent.trim();

        // Försök att konvertera cellvärdena till nummer
        const numA = sanitizeAndConvert(cellA);
        const numB = sanitizeAndConvert(cellB);

        // Kontrollera om båda cellvärdena är nummer
        if (!isNaN(numA) && !isNaN(numB)) {
            // Sortera som nummer
            return order === 'asc' ? numA - numB : numB - numA;
        } else {
            // Sortera som text
            return order === 'desc' ? cellA.localeCompare(cellB) : cellB.localeCompare(cellA);
        }
    });

    // Lägg tillbaka de sorterade raderna i tbody
    rows.forEach(row => tbody.appendChild(row));
}

// Funktion för att visa eller dölja totals
function ShowHideTotals() {
    tableTitleTextTotals.style.color = switchTotals.checked ? 'black' : 'gray';
    const tableTotalsContainer = document.querySelector('.tableTotalsContainer');
    tableTotalsContainer.style.display = switchTotals.checked ? 'block' : 'none';
}

// Funktion för att visa eller dölja portfolion
function ShowHidePortfolio(isPortfolioOn) {
    tableTitleTextPortfolio.style.color = isPortfolioOn ? 'black' : 'gray';
    const tablePortfolioContainer = document.querySelector('.tablePortfolioContainer');
    tablePortfolioContainer.style.display = isPortfolioOn ? 'block' : 'none';
}

// Funktion för att visa eller dölja transaktioner
function ShowHideTransactions(isTransactionsOn) {
    tableTitleTextTransactions.style.color = isTransactionsOn ? 'black' : 'gray';
    const tableTransactionsContainer = document.querySelector('.tableTransactionsContainer');
    tableTransactionsContainer.style.display = isTransactionsOn ? 'block' : 'none';
}

// Funktion för att visa eller dölja marknaden
function ShowHideMarket(isMarketOn) {
    tableTitleTextMarket.style.color = isMarketOn ? 'black' : 'gray';
    const tableMarketContainer = document.querySelector('.tableMarketContainer');
    tableMarketContainer.style.display = isMarketOn ? 'block' : 'none';
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

// Eventlyssnare för att sortera tabeller
document.querySelectorAll('.sort').forEach(sortElement => {
    sortElement.addEventListener('click', () => {
        const columnIndex = sortElement.getAttribute('data-column');
        let order = sortElement.getAttribute('data-order');
        const tableClass = sortElement.closest('table').className;

        // Om pilen är nedåt vid första klicket, sortera från högst till lägst
        if (order === 'asc') {
            order = 'desc';
        } else {
            order = 'asc';
        }

        sortTable(columnIndex, order, tableClass);

        // Återställ alla pilar till nedåt och ta bort aktiv klass
        document.querySelectorAll('.sort').forEach(el => {
            el.textContent = '▼';
            el.setAttribute('data-order', 'asc');
            el.classList.remove('active');
        });

        // Växla sorteringsordning för den klickade pilen och sätt aktiv klass
        sortElement.setAttribute('data-order', order);
        sortElement.textContent = order === 'asc' ? '▲' : '▼';
        sortElement.classList.add('active');
    });
});

// Eventlyssnare för att visa/dölja totals
switchTotals.addEventListener('click', () => {
    isTotalsOn = !isTotalsOn;
    ShowHideTotals(isTotalsOn);
});

// Eventlyssnare för att visa/dölja portfolion
switchPortfolio.addEventListener('click', () => {
    isPortfolioOn = !isPortfolioOn; 
    ShowHidePortfolio(isPortfolioOn);
});

// Eventlyssnare för att visa/dölja transaktioner
switchTransactions.addEventListener('click', () => {
    isTransactionsOn = !isTransactionsOn;
    ShowHideTransactions(isTransactionsOn);
});

// Eventlyssnare för att visa/dölja marknaden
switchMarket.addEventListener('click', () => {
    isMarketOn = !isMarketOn;
    ShowHideMarket(isMarketOn);
});

// Körs när sidan laddas
start();