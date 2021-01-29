const EventEmitter = require('events');

// create emitter object
class AssetStockEmitter extends EventEmitter {}
const emitter = new AssetStockEmitter();

/**
 * Register for event 'update_due_to_exchange'
 */
emitter.on('update_due_to_exchange', async (asset_id) => {
    // do nothing
});

/**
 * Register for event 'update_due_to_transaction'
 */
emitter.on('update_due_to_transaction', async (asset_id) => {
    // do nothing
});

/**
 * Handle errors
 */
emitter.on('error', (err) => {
    console.error('whoops! there was an error');
});

module.exports = emitter;