const ncron = require('node-cron');
const ExchangeStock = require('../models/stock/Exchange');
const AssetStock = require('../models/stock/Asset');
const ExchangeCrypto = require('../models/crypto/Exchange');
const AssetCrypto = require('../models/crypto/Asset');
const ExchangeForex = require('../models/cash/Exchange');
const AssetCash = require('../models/cash/Asset');
const Watchlist = require('../models/Watchlist');
const StockService = require('../services/StockService');
const CryptoService = require('../services/CryptoService');
const ForexService = require('../services/ForexService');

/**
 * Return the oldest exchange stock (since the last update).
 */
const getOldestStock = async () => {
    const oldest = await ExchangeStock.findOne({}, {'name': 1}, {sort: { 'updatedAt': 1 } }).lean();
    return oldest;
}

/**
 * Return the oldest exchange crypto (since the last update).
 */
const getOldestCrypto = async () => {
    const oldest = await ExchangeCrypto.findOne({}, {'from': 1, 'to': 1}, {sort: { 'updatedAt': 1 } }).lean();
    return oldest;
}

/**
 * Refresh the exchange stock with its often data, data which changes throughout the day.
 */
const refreshOftenExchangeStock = async () => {
    const oldestStock = await getOldestStock();
    if (oldestStock) {
        console.log('(cron-often) refreshing', oldestStock.name);
        const SS = new StockService();
        await SS.refreshStockQuote(oldestStock.name);
    }
}

/**
 * Refresh the exchange stock with its daily data, data which changes once per day.
 */
const refreshDailyExchangeStock = async () => {
    const oldestStock = await getOldestStock();
    if (oldestStock) {
        console.log('(cron-daily) refreshing', oldestStock.name);
        const SS = new StockService();
        await SS.refreshStockOverviewAndDaily(oldestStock.name);
    }
}

/**
 * Refresh the exchange stock with both its daily and quote data.
 */
const refreshDailyAndOftenExchangeStock = async() => {
    const oldestStock = await getOldestStock();
    if (oldestStock) {
        console.log('(cron-daily-often) refreshing', oldestStock.name);
        const SS = new StockService();
        await SS.refreshStockOverviewAndDaily(oldestStock.name);
        await SS.refreshStockQuote(oldestStock.name);
    }
}

/**
 * Purge exchange stocks which are unused
 */
const removeUnusedExchangeItems = async () => {
    // get distinct 'used' assets and watchlist entries
    const [assetStocks, watchlistStocks, assetCryptos, watchlistCryptos, assetCash, watchlistCash ] = await Promise.all([
        AssetStock.find({}).distinct('exchange_id'),
        Watchlist.find({}).distinct('stock_entries'),
        AssetCrypto.find({}).distinct('exchange_id'),
        Watchlist.find({}).distinct('crypto_entries'),
        AssetCash.find({}).distinct('exchange_id'),
        Watchlist.find({}).distinct('cash_entries'),
    ]);
    
    // join those lists into one of each type
    const usedStocks = [...new Set([...assetStocks, ...watchlistStocks])];
    const usedCryptos = [...new Set([...assetCryptos, ...watchlistCryptos])];
    const usedCash = [...new Set([...assetCash, ...watchlistCash])];

    // remove unused items
    await Promise.all([
        ExchangeStock.deleteMany({'_id': { $nin: usedStocks }}),
        ExchangeCrypto.deleteMany({'_id': { $nin: usedCryptos }}),
        ExchangeForex.deleteMany({'_id': { $nin: usedCash }}),
    ]);
}

/**
 * Update valid listings (stock, crypto, forex).
 */
const updateValidListings = async () => {
    const ss = new StockService();
    const cs = new CryptoService();
    const fs = new ForexService();
    await Promise.all([
        ss.updateValidStockListing(),
        cs.updateValidCryptoListing(),
        fs.updateValidForexListing(),
    ]);
}

module.exports = {
    initialize: async () => {

        // initialize cron jobs for when the stock market opens
        // ignore holidays for now
        
        // 9:30 until 10:00 (NYT)
        const marketFirstHalfHour = '30-59/5 14 * * Mon-Fri';
        ncron.schedule(marketFirstHalfHour, refreshOftenExchangeStock);
        
        // 10:00 until 16:00 (NYT)
        const marketRegularHours = '*/5 15-21 * * Mon-Fri';
        ncron.schedule(marketRegularHours, refreshOftenExchangeStock);

        // 17:00 until 19:00 (NYT)
        const marketAfterMarket = '*/2 22,23 * * Mon-Fri';
        ncron.schedule(marketAfterMarket, refreshDailyExchangeStock);

        // 5:00 until 10:00 (weekends)
        const fromFiveToTenOclock = '*/5 5-12 * * Sat,Sun';
        ncron.schedule(fromFiveToTenOclock, refreshDailyAndOftenExchangeStock);

        // purge unused stocks
        const atOneOclock = '0 1 * * *';
        ncron.schedule(atOneOclock, removeUnusedExchangeItems);

        // update valid listings
        const atOneOclockMonday = '0 1 * * Mon';
        ncron.schedule(atOneOclockMonday, updateValidListings);

        // complete
        console.log('Scheduler loaded!')
    }
};