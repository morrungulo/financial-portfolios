const AssetStock = require('../models/stock/Asset');

function isSame(left, right) {
    return (
        (left.unrealized_value === right.unrealized_value) &&
        (left.daily_value === right.daily_value) &&
        (left.daily_value_percentage === right.daily_value_percentage)
    );
}

function buildObject(unrealized_value, daily_value, daily_value_percentage) {
    return { unrealized_value, daily_value, daily_value_percentage };
}

/**
 * Calculates several asset fields based on some of the fields and exchange data.
 * Must have its 'exchange_id' entry populated.
 * @param {} asset 
 * @returns true if values have changed
 */
function assetStockCalculator(asset) {
    // get current values
    const oldval = buildObject(asset.unrealized_value, asset.daily_value, asset.daily_value_percentage);

    // calculate new values
    asset.unrealized_value = asset.total_quantity * asset.exchange_id.exchangeQuote.Price;
    asset.daily_value = asset.total_quantity * asset.exchange_id.exchangeQuote.Change;
    asset.daily_value_percentage = asset.exchange_id.exchangeQuote.ChangePercent;
    
    // return if values have changed
    const newval = buildObject(asset.unrealized_value, asset.daily_value, asset.daily_value_percentage);
    
    return !isSame(oldval, newval);
}

async function assetStockCalculatorFull(asset_id) {
    let asset = await AssetStock.findById(asset_id);
    await asset.populate({ path: 'exchange_id' }).execPopulate();
    if (assetStockCalculator(asset)) {
        await asset.save();
    }
}

module.exports = {
    assetStockCalculatorFull,
}
    