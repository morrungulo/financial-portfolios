const AssetCrypto = require('../models/crypto/Asset');
const TransactionCrypto = require('../models/crypto/Transaction');
const AssetCash = require('../models/cash/Asset');
const TransactionCash = require('../models/cash/Transaction');
const {prepareCommonDataForUpdate} = require('./utils')
const chalk = require('chalk');

/**
 * Calculate unrealized_value (and percentage).
 */
const updateUnrealizedValueAndPercentage = (asset) => {
    if (asset.isOpen) {
        asset.common.unrealized_value = asset.common.total_quantity * asset.exchange_id.exchangeRate.Rate;
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
        asset.common.daily_value = asset.common.total_quantity * asset.exchange_id.exchangeCalculated.Change;
        asset.common.daily_value_percentage = asset.exchange_id.exchangeCalculated.ChangePercent;
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
 * @param {mongoose model} transactionModel
 * @param {ObjectId} asset_id
 * @returns JSON object with the asset aggregated values from the transaction
 */
const transactionAggregator = async (transactionModel, asset_id) => {
    const data = await transactionModel.aggregate([
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
                total_commissions: true,
                total_cost: true,
                total_realized: true,
                total_transactions: true,
                realized_value: '$total_realized',
                total_quantity: '$unrealized.quantity',
                average_cost_per_unit: '$unrealized.weighted_average_unit_cost',
            },
        },
    ]);
    console.log(chalk.cyan(JSON.stringify(data)));

    let [tdata] = data;
    if (tdata === undefined) {
        tdata = {
            total_commissions: 0,
            total_cost: 0,
            total_realized: 0,
            total_transactions: 0,
            realized_value: 0,
            total_quantity: 0,
            average_cost_per_unit: 0,
        };
    }
    return tdata;
}

/**
 * Calculates the asset crypto fields which depend on exchange data.
 * @param {ObjectId} asset_id 
 */
const calculateAssetCryptoFromExchangeData = async (asset_id) => {
    const asset = await AssetCrypto.findById(asset_id).populate({ path: 'exchange_id' });
    updateFieldsDependentOnExchangeData(asset);
    await asset.save();
}

/**
 * Calculates the asset crypto fields dependent on transaction data.
 * @param {ObjectId} asset_id 
 */
const calculateAssetCryptoFieldsFromTransactions = async (asset_id) => {
    const tdata = await transactionAggregator(TransactionCrypto, asset_id);
    await AssetCrypto.findByIdAndUpdate(asset_id, {$set: prepareCommonDataForUpdate(tdata)});
}

/**
 * Calculates the asset fields which depend on exchange data.
 * @param {ObjectId} asset_id 
 */
const calculateAssetCashFromExchangeData = async (asset_id) => {
    const asset = await AssetCash.findById(asset_id).populate({ path: 'exchange_id' });
    updateFieldsDependentOnExchangeData(asset);
    await asset.save();
}

/**
 * Calculates the asset stock fields dependent on transaction data.
 * @param {ObjectId} asset_id 
 */
const calculateAssetCashFieldsFromTransactions = async (asset_id) => {
    const tdata = await transactionAggregator(TransactionCash, asset_id);
    await AssetCash.findByIdAndUpdate(asset_id, {$set: prepareCommonDataForUpdate(tdata)});
}

module.exports = {
    calculateAssetCryptoFromExchangeData,
    calculateAssetCryptoFieldsFromTransactions,
    calculateAssetCashFromExchangeData,
    calculateAssetCashFieldsFromTransactions,
}