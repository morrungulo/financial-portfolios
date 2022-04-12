const EventEmitter = require('events');
const mongoose = require('mongoose');
const ExchangeStock = require('../models/stock/Exchange');
const decimation = require('../util/decimation');

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
                    y: '$exchangeDaily.AdjustedClose',
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
            const decimatedData = decimation.applyDecimation(data);
            await ExchangeStock.findByIdAndUpdate(exchange_id, { $set: { 'exchangeGraphData': decimatedData } });
        } catch (err) {
            console.error(err);
        }
    }

    // update calculated items
    async updateCalculatedItems(exchange_id) {
        try {
            const exItem = await ExchangeStock.findById(exchange_id);
            exItem.exchangeCalculated.DividendYieldPercent = 100 * (exItem.exchangeOverview.Dividend / exItem.exchangeQuote.Price);
            if (exItem.exchangeOverview.EPS != 0) {
                exItem.exchangeCalculated.DividendPayoutRatioPercent = 100 * (1 - (exItem.exchangeOverview.EPS - exItem.exchangeOverview.Dividend) / exItem.exchangeOverview.EPS);
            } else {
                exItem.exchangeCalculated.DividendPayoutRatioPercent = 0;
            }
            exItem.exchangeCalculated.Week52RangePercent = 100 * ((exItem.exchangeQuote.Price - exItem.exchangeOverview.Week52Low) / (exItem.exchangeOverview.Week52High - exItem.exchangeOverview.Week52Low));
            await exItem.save();
        } catch (err) {
            console.error(err);
        }
    }

}
const emitter = new ExchangeStockEmitter();

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