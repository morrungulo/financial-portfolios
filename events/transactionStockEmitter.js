const EventEmitter = require('events');
const TransactionStock = require('../models/stock/Transaction');
const AssetStock = require('../models/stock/Asset');
const AssetStockEmitter = require('./assetStocksEmitter');

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

                    // calculate quantity of shares
                    // on buy, we add the quantity to the total
                    // on split, we multiply the ratio with existing total
                    // on dividends, we do nothing (quantity=0, ratio=1)
                    // on sell, we remove the quantity from the total
                    total_quantity: {
                        $accumulator: {
                            lang: 'js',
                            init: function () {
                                return { total: 0 };
                            },
                            accumulate: function (state, quantity, split_ratio) {
                                return {
                                    total: state.total * split_ratio + quantity
                                }
                            },
                            accumulateArgs: ['$quantity', '$split_ratio'],
                            merge: function (state1, state2) {
                                return {
                                    total: state1.total + state2.total
                                }
                            },
                            finalize: function (state) {
                                return state.total;
                            }
                        }
                    },

                    total_transactions: { $sum: 1 },
                }
            },
            {
                $addFields: {
                    realized_value: { $add: ['$total_realized', '$total_dividends'] },
                },
            },
            {
                $project: {
                    _id: false,
                    total_quantity: true,
                    total_cost: true,
                    realized_value: true,
                    total_dividends: true,
                    total_commissions: true,
                    total_transactions: true,
                },
            },
        ]);
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
    await AssetStock.findByIdAndUpdate(transaction.asset_id, tdata);
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
            total_quantity: 0,
            total_cost: 0,
            realized_value: 0,
            total_dividends: 0,
            total_commissions: 0,
            total_transactions: 0,
        };
    }
    await AssetStock.findByIdAndUpdate(transaction.asset_id, tdata);
    AssetStockEmitter.emit('update_transaction', transaction.asset_id);
})

emitter.on('error', (err) => {
    console.error('whoops! there was an error');
});

module.exports = emitter;