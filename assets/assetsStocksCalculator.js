const AssetStock = require('../models/stock/Asset');
const TransactionStock = require('../models/stock/Transaction');
const AssetStockEmitter = require('../events/assetStocksEmitter');
const chalk = require('chalk');

const isSame = (left, right) => {
    return left === right;
}

const buildObject = (asset) => {
    return JSON.stringify(asset);
}

const updateUnrealizedValueAndPercentage = (asset) => {
    const hasCost = (asset.total_cost != 0);
    asset.unrealized_value = asset.total_quantity * asset.exchange_id.exchangeQuote.Price;
    asset.unrealized_value_percentage = hasCost ? 100 * (asset.unrealized_value + asset.realized_value - asset.total_cost) / asset.total_cost : 0;
}

const updateDailyValueAndPercentage = (asset) => {
    const hasShares = (asset.total_quantity != 0);
    asset.daily_value = hasShares ? asset.total_quantity * asset.exchange_id.exchangeQuote.Change : 0;
    asset.daily_value_percentage = hasShares ? asset.exchange_id.exchangeQuote.ChangePercent : 0;
}

/**
 * 
 * @param {AssetStockInst} asset
 * @returns true if any of the fields was updated 
 */
const updateFieldsDependentOnExchangeData = (asset) => {
    // get current values
    const oldval = buildObject(asset);

    // calculate new values
    updateUnrealizedValueAndPercentage(asset);
    updateDailyValueAndPercentage(asset);

    // check if values have changed
    const newval = buildObject(asset);
    return !isSame(oldval, newval);
}

/**
 * @param {ObjectId} asset_id 
 * @returns JSON object with the transaction aggregated values
 */
const transactionStockAggregator = async (asset_id) => {
    const data = await TransactionStock.aggregate([
        {
            $match: { asset_id }
        },
        {
            $sort: { date: 1 },
        },
        {
            $group: {
                _id: '$asset_id',

                // add values from all transactions
                total_dividends: { $sum: '$dividend' },
                total_commissions: { $sum: '$commission' },
                total_cost: { $sum: '$cost' },
                total_realized: { $sum: '$realized' },

                // sum all transactions                    
                total_transactions: { $sum: 1 },

                // calculate quantity of shares and the weighted average price for each
                // - on buy, we add the unrealized+commission to the costs and the quantity to the lot and to the total
                // - on sell, we add the commission to the costs
                // - on split, we multiply the ratio to the lot and to the total
                // - on dividends, we do nothing (quantity=0, unrealized=0, commission=0, ratio=1)
                unrealized: {
                    $accumulator: {
                        lang: 'js',
                        init: function () {
                            return { lot: { costs: 0, quantity: 0 }, total: 0 };
                        },
                        accumulateArgs: ['$cost', '$quantity', '$split_ratio'],
                        accumulate: function (state, cost, quantity, split_ratio) {
                            const bq = (quantity > 0) ? quantity : 0;
                            const result = {
                                lot: {
                                    costs: state.lot.costs + cost,
                                    quantity: (state.lot.quantity + bq) * split_ratio,
                                },
                                total: (state.total + quantity) * split_ratio,
                            };
                            // if there are no shares, reset state
                            if (result.total == 0) {
                                result.lot.costs = 0;
                                result.lot.quantity = 0;
                            }
                            return result;
                        },
                        merge: function (state1, state2) {
                            return {
                                lot: {
                                    costs: (state1.lot.costs * state2.lot.quantity) + (state2.lot.costs * state1.lot.quantity),
                                    quantity: state1.lot.quantity * state2.lot.quantity,
                                },
                                total: state1.total + state2.total,
                            };
                        },
                        finalize: function (state) {
                            return {
                                quantity: state.total,
                                weighted_average_share_cost: (state.lot.quantity == 0) ? 0 : state.lot.costs / state.lot.quantity,
                            };
                        },
                    },
                },
            },
        },
        {
            $project: {
                _id: false,
                total_dividends: true,
                total_commissions: true,
                total_cost: true,
                total_realized: true,
                total_transactions: true,
                realized_value: { $add: ['$total_realized', '$total_dividends'] },
                total_quantity: '$unrealized.quantity',
                avg_cost_per_share: '$unrealized.weighted_average_share_cost',
            },
        },
    ]);
    console.log(chalk.cyan(JSON.stringify(data)));

    let [tdata] = data;
    if (tdata === undefined) {
        tdata = {
            total_dividends: 0,
            total_commissions: 0,
            total_cost: 0,
            total_realized: 0,
            total_transactions: 0,
            realized_value: 0,
            total_quantity: 0,
            avg_cost_per_share: 0,
        };
    }
    return tdata;
}

const updateFieldsDependentOnTransactionData = async (asset) => {
    // get current values
    const oldval = buildObject(asset);

    const tdata = await transactionStockAggregator(asset._id);
    Object.assign(asset, tdata);

    // check if values have changed
    const newval = buildObject(asset);
    return !isSame(oldval, newval);
}

/**
 * Calculates the asset fields which depend on exchange data.
 * @param {ObjectId} asset_id 
 */
const calculateAssetStockFromExchangeData = async (asset_id) => {
    const asset = await AssetStock.findById(asset_id);
    await asset.populate({ path: 'exchange_id' }).execPopulate();
    if (updateFieldsDependentOnExchangeData(asset)) {
        await asset.save();
        AssetStockEmitter.emit('update_due_to_exchange', asset_id);
    }
}

/**
 * Calculates the asset fields which depend on transaction data.
 * @param {ObjectId} asset_id 
 */
const calculateAssetStockFromTransactions = async (asset_id) => {
    const asset = await AssetStock.findById(asset_id);
    if (await updateFieldsDependentOnTransactionData(asset)) {
        await asset.save();
        AssetStockEmitter.emit('update_due_to_transaction', asset_id);
    }
}

module.exports = {
    calculateAssetStockFromExchangeData,
    calculateAssetStockFromTransactions,
}
