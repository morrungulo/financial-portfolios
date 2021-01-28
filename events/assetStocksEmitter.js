const EventEmitter = require('events');
const chalk = require('chalk');
const AssetStock = require('../models/stock/Asset');
const { assetStockCalculator } = require('../assets/assetsCalculator')

class AssetStockEmitter extends EventEmitter {
}

// create emitter object
const emitter = new AssetStockEmitter();

/**
 * Register for event 'update_transaction'
 */
emitter.on('update_transaction', async (asset_id) => {
    await assetStockCalculator(asset_id);
})

emitter.on('error', (err) => {
    console.error('whoops! there was an error');
});

module.exports = emitter;