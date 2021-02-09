const ncron = require('node-cron');
const ExchangeStock = require('../models/stock/Exchange');
const StockService = require('../services/StockService');

/**
 * Return the oldest exchange stock (since the last update).
 */
const getOldest = async () => {
    return ExchangeStock.findOne({}, {'name': 1}, {sort: { 'updatedAt': 1 } }).lean();
}

/**
 * Refresh the exchange stock with its often data, data which changes throughout the day.
 */
const refreshOftenExchangeStock = async () => {
    const oldestStock = await getOldest();
    if (oldestStock) {
        console.log('(cron-often) refreshing ' + oldestStock.name);
        const SS = new StockService();
        SS.refreshStockQuote(oldestStock.name);
    }
}

/**
 * Refresh the exchange stock with its daily data, data which changes once per day.
 */
const refreshDailyExchangeStock = async () => {
    const oldestStock = await getOldest();
    if (oldestStock) {
        console.log('(cron-daily) refreshing ' + oldestStock.name);
        const SS = new StockService();
        SS.refreshStockOverviewAndDaily(oldestStock.name);
    }
}

module.exports = {
    initialize: ((callback) => {

        // initialize cron jobs for when the stock market opens
        // ignore holidays for now
        
        // 9:30 until 10:00 (NYT)
        const marketFirstHalfHour = '30-59 14 * * 1-5';
        ncron.schedule(marketFirstHalfHour, refreshOftenExchangeStock);
        
        // 10:00 until 16:00 (NYT)
        const marketRegularHours = '*/3 15-21 * * 1-5';
        ncron.schedule(marketRegularHours, refreshOftenExchangeStock);

        // 17:00 until 19:00 (NYT)
        const marketAfterMarket = '* 22,23 * * 1-5';
        ncron.schedule(marketAfterMarket, refreshDailyExchangeStock);

        callback();
    })
}