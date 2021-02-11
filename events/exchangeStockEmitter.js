const EventEmitter = require('events');
const ExchangeStock = require('../models/stock/Exchange');
const mongoose = require('mongoose');

// create emitter object
class ExchangeStockEmitter extends EventEmitter {

    /**
     * Returns a list of {x,y} coordinate objects based on the exchangeDaily field.
     * @param {ObjectId} id 
     */
    async getXYfromDaily(exchange_id) {
        const ObjectId = mongoose.Types.ObjectId;
        const criteria = { _id: ObjectId(exchange_id) };
        const data = await ExchangeStock.aggregate([
            { $match: criteria },
            { $unwind: '$exchangeDaily' },
            {
                $project: {
                    _id: false,
                    x: '$exchangeDaily.LastRefreshed',
                    y: '$exchangeDaily.Close',
                }
            },
            { $sort: { 'x': -1 } },
        ]);
        return data;
    }

    /**
     * Updates the exchange stock with id 'exchange_id' with the X,Y coordinates from exchangeDaily time series.
     * @param {ObjectId} exchange_id 
     */
    async updateXYDaily(exchange_id) {
        try {
            const data = await this.getXYfromDaily(exchange_id);
            await ExchangeStock.findByIdAndUpdate(exchange_id, { $set: {'exchangeXYDaily': data} });
        } catch (err) {
            console.error(err);
        }    
    }

}
const emitter = new ExchangeStockEmitter();

/**
 * Register for event 'create'
 */
emitter.on('create', async (exchange_id) => {
    await emitter.updateXYDaily(exchange_id);
});

/**
 * Register for event 'update_quote'
 */
emitter.on('update_quote', async (exchange_id) => {
    // do nothing
});

/**
 * Register for event 'update_daily'
 */
emitter.on('update_daily', async (exchange_id) => {
    await emitter.updateXYDaily(exchange_id);
});

/**
 * Handle errors
 */
emitter.on('error', (err) => {
    console.error('whoops! there was an error');
});

module.exports = emitter;