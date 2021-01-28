const EventEmitter = require('events');
const TransactionStock = require('../models/stock/Transaction');
const AssetStock = require('../models/stock/Asset');
const AssetStockEmitter = require('./assetStocksEmitter');
const chalk = require('chalk');

class TransactionStockEmitter extends EventEmitter {

    /**
     * Returns a JSON object with several stats compiled from the 'asset_id' transactions.
     * @param {ObjectId} asset_id
     */
    async transactionAggregator(asset_id) {
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
                        }
                    },
                },
            },
            {
                $project: {
                    _id: false,
                    test: true,
                    total_dividends: true,
                    total_commissions: true,
                    total_cost: true,
                    total_realized: true,
                    total_transactions: true,

                    unrealized: false,
                    realized_value: { $add: ['$total_realized', '$total_dividends'] },
                    total_quantity: '$unrealized.quantity',
                    avg_cost_per_share: '$unrealized.weighted_average_share_cost',

                },
            },
        ]);
        console.log(chalk.cyan(JSON.stringify(data)));
        return data;
    }

}

// create emitter object
const emitter = new TransactionStockEmitter();

/**
 * Register for event 'create'
 */
emitter.on('create', async (transaction) => {
    const [tdata] = await emitter.transactionAggregator(transaction.asset_id);
    await AssetStock.findByIdAndUpdate(transaction.asset_id, { $set: tdata });
    AssetStockEmitter.emit('update_transaction', transaction.asset_id);
})

/**
 * Register for event 'delete'
 */
emitter.on('delete', async (transaction) => {
    let [tdata] = await emitter.transactionAggregator(transaction.asset_id);

    // if there are no transactions, then set all attributes to zero
    if (tdata === undefined) {
        tdata = {
            total_dividends: 0,
            total_commissions: 0,
            total_transactions: 0,
            realized_value: 0,
            total_quantity: 0,
            avg_cost_per_share: 0,
            total_cost: 0,
        };
    }
    await AssetStock.findByIdAndUpdate(transaction.asset_id, { $set: tdata });
    AssetStockEmitter.emit('update_transaction', transaction.asset_id);
})

emitter.on('error', (err) => {
    console.error('whoops! there was an error');
});

module.exports = emitter;