const EventEmitter = require('events');
const mongoose = require('mongoose');
const ExchangeForex = require('../models/cash/Exchange');
const decimation = require('../util/decimation');


// create emitter object
class ExchangeCashEmitter extends EventEmitter {

    /**
     * Returns a list of {x,y} coordinate objects based on the exchangeDaily field.
     * @param {ObjectId} id 
     */
    async getXYfromDaily(exchange_id) {
        const ObjectId = mongoose.Types.ObjectId;
        const criteria = { _id: ObjectId(exchange_id) };
        const data = await ExchangeForex.aggregate([
            { $match: criteria },
            { $unwind: '$exchangeDaily' },
            {
                $project: {
                    _id: false,
                    x: '$exchangeDaily.LastRefreshed',
                    y: '$exchangeDaily.Close',
                    o: '$exchangeDaily.Open',
                    h: '$exchangeDaily.High',
                    l: '$exchangeDaily.Low',
                    c: '$exchangeDaily.Close',
                }
            },
            { $sort: { 'x': -1 } },
        ]);
        return data;
    }

    /**
     * Updates the exchange cash with id 'exchange_id' with the X,Y coordinates from exchangeDaily time series.
     * @param {ObjectId} exchange_id 
     */
    async updateXYDaily(exchange_id) {
        try {
            const data = await this.getXYfromDaily(exchange_id);
            const decimatedData = decimation.applyDecimation(data, false);
            await ExchangeForex.findByIdAndUpdate(exchange_id, { $set: {'exchangeGraphData': decimatedData} });
        } catch (err) {
            console.error(err);
        }    
    }

}
const emitter = new ExchangeCashEmitter();

/**
 * Register for event 'create'
 */
emitter.on('create', async (exchange_id) => {
    await emitter.updateXYDaily(exchange_id);
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