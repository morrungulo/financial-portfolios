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
            await ExchangeCrypto.findByIdAndUpdate(exchange_id, { $set: { 'exchangeGraphData': decimatedData } });
        } catch (err) {
            console.error(err);
        }
    }

    // update calculated items
    async updateCalculatedItems(exchange_id) {
        try {
            const exItem = await ExchangeCrypto.findById(exchange_id);
            if (exItem.exchangeDaily.length >= 2) {
                exItem.exchangeCalculated.Change = exItem.exchangeDaily[0].Close - exItem.exchangeDaily[1].Close;
                exItem.exchangeCalculated.ChangePercent = 100 * (exItem.exchangeCalculated.Change / exItem.exchangeDaily[1].Close);
                await exItem.save();
            }
        } catch (err) {
            console.error(err);
        }
    }

}
const emitter = new ExchangeCryptoEmitter();

/**
 * Register for event 'create'
 */
emitter.on('create', (exchange_id) => {
    Promise.all([
        emitter.updateXYDaily(exchange_id),
        emitter.updateCalculatedItems(exchange_id),
    ]);
});

/**
 * Register for event 'refresh'
 */
emitter.on('refresh', (exchange_id) => {
    Promise.all([
        emitter.updateXYDaily(exchange_id),
        emitter.updateCalculatedItems(exchange_id),
    ]);
});

/**
 * Register for event 'delete'
 */
emitter.on('delete', (exchange_id) => {
    // do nothing
});

/**
 * Handle errors
 */
emitter.on('error', (err) => {
    console.error('whoops! there was an error');
});

module.exports = emitter;