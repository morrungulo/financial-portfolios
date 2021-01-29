const EventEmitter = require('events');
const { calculateAssetStockFromTransactions } = require('../assets/assetsStocksCalculator');

// create emitter object
class TransactionStockEmitter extends EventEmitter {}
const emitter = new TransactionStockEmitter();

/**
 * Register for event 'create'
 */
emitter.on('create', async (transaction) => {
    await calculateAssetStockFromTransactions(transaction.asset_id);
});

/**
 * Register for event 'delete'
 */
emitter.on('delete', async (transaction) => {
    await calculateAssetStockFromTransactions(transaction.asset_id);
});

/**
 * Handle errors
 */
emitter.on('error', (err) => {
    console.error('whoops! there was an error');
});

module.exports = emitter;