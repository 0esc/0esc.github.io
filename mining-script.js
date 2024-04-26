// JSON data from the files gpus.json and coins.json is fetched and stored in the window object
document.addEventListener('DOMContentLoaded', function() {
    // Fetch the JSON data from the files gpus.json and coins.json
    Promise.all([
        fetch('gpus.json').then(response => response.json()),
        fetch('coins.json').then(response => response.json())
    // Store the data in the window object and call the addGpuEntry function
    ]).then(data => {
        const [gpus, coins] = data;
        window.gpusData = gpus; 
        window.coinsData = coins;
        addGpuEntry(); 
    });
});

// Function to add a new GPU entry to the form
function addGpuEntry() {
    const gpuEntriesDiv = document.getElementById('gpuEntries');
    const gpuSelectDiv = document.createElement('div');
    // The innerHTML of the div is set to a select element with options for each GPU model and an input element for the quantity
    gpuSelectDiv.innerHTML = `
        <label>Select GPU:</label>
        <select class="gpuSelect" name="gpu">
            ${window.gpusData.GPUs.map(gpu => `<option value="${gpu.model}">${gpu.model}</option>`).join('')}
        </select>
        <label>Quantity:</label>
        <input type="number" class="gpuQuantity" name="quantity" value="1" min="1">
        <button type="button" onclick="this.parentNode.remove()">Remove</button>
    `;
    // The div is appended to the GPU entries div
    gpuEntriesDiv.appendChild(gpuSelectDiv);
}

// Event listener for the add GPU button
document.getElementById('miningForm').addEventListener('submit', function(event) {
    event.preventDefault();
    const entries = Array.from(document.getElementsByClassName('gpuSelect'));
    const quantities = Array.from(document.getElementsByClassName('gpuQuantity'));
    const electricityCost = parseFloat(document.getElementById('electricityCost').value);
    
    // Array to store the results of the calculations
    let results = [];
    entries.forEach((entry, index) => {
        const gpuModel = entry.value;
        const quantity = parseInt(quantities[index].value);

        // For each coin, calculate the profitability and push the result to the results array
        Object.keys(window.coinsData).forEach(coin => {
            const result = calculateProfitability(gpuModel, coin, quantity, electricityCost);
            if (result) {
                results.push(result);
            }
        });
    });
    // Display the results function is called with the results array as the argument
    displayResults(results);
});

// Function to calculate the profitability of mining a coin with a GPU
function calculateProfitability(gpuModel, coin, quantity, electricityCost) {
    const gpuData = window.gpusData.GPUs.find(gpu => gpu.model === gpuModel);
    const coinData = window.coinsData[coin];
    // If the GPU or coin data is missing or structured incorrectly, an error is logged and null is returned
    if (!gpuData || !coinData || !gpuData.details || !gpuData.details[coin]) {
        console.error('GPU or Coin data is missing or structured incorrectly', { gpuData, coinData });
        return null;
    }

    // Parse the numbers from the coin data
    const difficulty = parseFloat(coinData.difficulty.replace(/,/g, '')); 
    // The block reward is multiplied by the quantity of GPUs to get the total block reward
    const blockReward = parseFloat(coinData.blockReward.replace(/,/g, '')); 
    const pricePerCoin = parseFloat(coinData.pricePerCoin);
    const poolFee = parseFloat(coinData.poolFee);
    const blockTime = parseFloat(coinData.blockTime);
    const hashrate = parseFloat(gpuData.details[coin].hashrate) * quantity;
    const wattage = parseFloat(gpuData.details[coin].wattage) * quantity;
    const hoursPerDay = 24;

    // The power cost per day is calculated by multiplying the wattage by the electricity cost and dividing by 1000 to convert to kilowatts
    const powerCostPerDay = wattage * electricityCost / 1000;
    // The coins per day is calculated by multiplying the block reward by the hashrate, subtracting the pool fee, and dividing by the difficulty and block time
    const coinsPerDay = blockReward * hashrate * (1 - poolFee) / (difficulty * blockTime);
    const revenue = coinsPerDay * pricePerCoin;
    const profit = revenue - powerCostPerDay;

    // Returning an object with the calculated values
    return {
        gpuModel: gpuModel,
        coin: coin,
        hashRate: hashrate.toFixed(2) + ' MH/s',
        powerUsage: wattage.toFixed(2) + ' W',
        dailyRevenue: '$' + revenue.toFixed(2),
        dailyProfit: '$' + profit.toFixed(2)
    };
}

// Function to display the results in the table
function displayResults(results) {
    // The results table body is cleared
    const resultsBody = document.getElementById('resultsTable').querySelector('tbody');
    resultsBody.innerHTML = '';

    // For each result, a new row is inserted into the table with the values of the result
    results.forEach(result => {
        const row = resultsBody.insertRow();
        row.insertCell().textContent = result.gpuModel;
        row.insertCell().textContent = result.coin;
        row.insertCell().textContent = result.hashRate;
        row.insertCell().textContent = result.powerUsage;
        row.insertCell().textContent = result.dailyRevenue; 
        row.insertCell().textContent = result.dailyProfit; 
    });
}