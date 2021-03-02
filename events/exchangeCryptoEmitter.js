const EventEmitter = require('events');
const mongoose = require('mongoose');
const ExchangeCrypto = require('../models/crypto/Exchange');
const { applyDecimation } = require('../util/decimation');


// create emitter object
class ExchangeCryptoEmitter extends EventEmitter {

    /**
     * Returns a list of {x,y} coordinate objects based on the exchangeDaily field.
     * @param {ObjectId} id 
     */
    async getXYfromDaily(exchange_id) {
        const ObjectId = mongoose.Types.ObjectId;
        const criteria = { _id: ObjectId(exchange_id) };
        const data = await ExchangeCrypto.aggregate([
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
                    v: '$exchangeDaily.Volume',
                }
            },
            { $sort: { 'x': -1 } },
        ]);
        return data;
    }

    /**
     * Updates the exchange crypto with id 'exchange_id' with the X,Y coordinates from exchangeDaily time series.
     * @param {ObjectId} exchange_id 
     */
    async updateXYDaily(exchange_id) {
        try {
            const data = await this.getXYfromDaily(exchange_id);
            const decimatedData = applyDecimation(data, false);
            await ExchangeCrypto.findByIdAndUpdate(exchange_id, { $set: {'exchangeGraphData': decimatedData} });
        } catch (err) {
            console.error(err);
        }    
    }

}
const emitter = new ExchangeCryptoEmitter();

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