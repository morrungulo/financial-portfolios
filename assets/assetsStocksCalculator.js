const AssetStock = require('../models/stock/Asset');
const TransactionStock = require('../models/stock/Transaction');
const ExchangeStock = require('../models/stock/Exchange');
const { prepareCommonDataForUpdate, calculateNewStateFromTransactionData } = require('./utils')

/**
 * Calculate unrealized_value (and percentage).
 */
const updateUnrealizedValueAndPercentage = (asset) => {
    if (asset.isOpen) {
        asset.common.unrealized_value = asset.common.total_quantity * asset.exchange_id.exchangeQuote.Price;
        const hasCost = (asset.common.total_cost != 0);
        asset.common.unrealized_value_percentage = hasCost ? 100 * (asset.common.unrealized_value + asset.common.realized_value - asset.common.total_cost) / asset.common.total_cost : 0;
    } else {
        asset.common.unrealized_value = 0;
        asset.common.unrealized_value_percentage = 0;
    }
}

/**
 * Calculate daily_value (and percentage).
 */
const updateDailyValueAndPercentage = (asset) => {
    if (asset.isOpen) {
        asset.common.daily_value = asset.common.total_quantity * asset.exchange_id.exchangeQuote.Change;
        asset.common.daily_value_percentage = asset.exchange_id.exchangeQuote.ChangePercent;
    } else {
        asset.common.daily_value = 0;
        asset.common.daily_value_percentage = 0;
    }
}

/**
 * @param {mongoose} asset
 */
const updateFieldsDependentOnExchangeData = (asset) => {
    updateUnrealizedValueAndPercentage(asset);
    updateDailyValueAndPercentage(asset);
}

/**
 * @param {ObjectId} asset_id 
 * @returns JSON object with the asset aggregated values from the transaction
 */
const transactionAggregator = async (asset_id) => {
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
                // - on units, we add the commission to the costs and the quantity to the lot and to the total
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
                                weighted_average_unit_cost: (state.lot.quantity == 0) ? 0 : state.lot.costs / state.lot.quantity,
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
                average_cost_per_unit: '$unrealized.weighted_average_unit_cost',
            },
        },
    ]);
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
            average_cost_per_unit: 0,
        };
    }

    return calculateNewStateFromTransactionData(tdata);
}

/**
 * Calculates the asset fields which depend on exchange data.
 * @param {ObjectId} asset_id 
 */
const calculateAssetStockFromExchangeData = async (asset_id) => {
    const asset = await AssetStock.findById(asset_id).populate({ path: 'exchange_id' });
    updateFieldsDependentOnExchangeData(asset);
    await asset.save();
}

/**
 * Calculates the asset stock fields dependent on transaction data.
 * @param {ObjectId} asset_id 
 */
const calculateAssetStockFieldsFromTransactions = async (asset_id) => {
    const tdata = await transactionAggregator(asset_id);
    await AssetStock.findByIdAndUpdate(asset_id, { $set: prepareCommonDataForUpdate(tdata) });
}

module.exports = {
    calculateAssetStockFromExchangeData,
    calculateAssetStockFieldsFromTransactions,
}