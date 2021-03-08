const EventEmitter = require('events');
const { calculateAssetCryptoFieldsFromTransactions } = require('../assets/assetsCurrenciesCalculator');

// create emitter object
class TransactionCryptoEmitter extends EventEmitter {}
const emitter = new TransactionCryptoEmitter();

/**
 * Register for event 'create'
 */
emitter.on('create', async (transaction) => {
    await calculateAssetCryptoFieldsFromTransactions(transaction.asset_id);
});

/**
 * Register for event 'delete'
 */
emitter.on('delete', async (transaction) => {
    await calculateAssetCryptoFieldsFromTransactions(transaction.asset_id);
});

/**
 * Handle errors
 */
emitter.on('error', (err) => {
    console.error('whoops! there was an error');
});

module.exports = emitter;