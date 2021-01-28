const AssetStock = require('../models/stock/Asset');

function isSame(left, right) {
    return left === right;
}

function buildObject(asset) {
    return JSON.stringify(asset);
}

function calculateUnrealizedValueAndPercentage(asset) {
    const hasCost = (asset.total_cost != 0);
    asset.unrealized_value = asset.total_quantity * asset.exchange_id.exchangeQuote.Price;
    asset.unrealized_value_percentage = hasCost ? 100 * (asset.unrealized_value + asset.realized_value - asset.total_cost) / asset.total_cost : 0;
}

function calculateDailyValueAndPercentage(asset) {
    const hasShares = (asset.total_quantity != 0);
    asset.daily_value = hasShares ? asset.total_quantity * asset.exchange_id.exchangeQuote.Change : 0;
    asset.daily_value_percentage = hasShares ? asset.exchange_id.exchangeQuote.ChangePercent : 0;
}

/**
 * Calculates several asset fields based on some of the fields and exchange data.
 * Must have its 'exchange_id' entry populated.
 * @param {} asset 
 * @returns true if values have changed
 */
function assetStockCalculator(asset) {
    // get current values
    const oldval = buildObject(asset);
    
    // calculate new values
    calculateUnrealizedValueAndPercentage(asset);
    calculateDailyValueAndPercentage(asset);

    // check if values have changed
    const newval = buildObject(asset);
    return !isSame(oldval, newval);
}

async function assetStockCalculator(asset_id) {
    let asset = await AssetStock.findById(asset_id);
    if (asset) {
        await asset.populate({ path: 'exchange_id' }).execPopulate();
        if (assetStockCalculator(asset)) {
            await asset.save();
        }
    }
}

module.exports = {
    assetStockCalculator,
}
    