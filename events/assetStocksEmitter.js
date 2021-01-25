const EventEmitter = require('events');
const chalk = require('chalk');
const AssetStock = require('../models/stock/Asset');
const { assetStockCalculatorFull } = require('../assets/assetsCalculator')

class AssetStockEmitter extends EventEmitter {
}

// create emitter object
const emitter = new AssetStockEmitter();

/**
 * Register for event 'update_transaction'
 */
emitter.on('update_transaction', async (asset_id) => {
    await assetStockCalculatorFull(asset_id);
    
    // let asset = await AssetStock.findById(asset_id);
    // await asset.populate({ path: 'exchange_id' }).execPopulate();
    // if(assetStockCalculator(asset)) {
    //     await asset.save();
    // }
})

emitter.on('error', (err) => {
    console.error('whoops! there was an error');
});

module.exports = emitter;