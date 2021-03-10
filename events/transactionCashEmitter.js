const EventEmitter = require('events');
const { calculateAssetCashFieldsFromTransactions } = require('../assets/assetsCurrenciesCalculator');

// create emitter object
class TransactionCashEmitter extends EventEmitter {}
const emitter = new TransactionCashEmitter();

/**
 * Register for event 'create'
 */
emitter.on('create', (transaction) => {
    calculateAssetCashFieldsFromTransactions(transaction.asset_id);
});

/**
 * Register for event 'delete'
 */
emitter.on('delete', (transaction) => {
    calculateAssetCashFieldsFromTransactions(transaction.asset_id);
});

/**
 * Handle errors
 */
emitter.on('error', (err) => {
    console.error('whoops! there was an error');
});

module.exports = emitter;