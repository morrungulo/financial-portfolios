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
const getOldest = async (exchangeModel) => {
    const oldest = await exchangeModel.findOne({}, 'name from to', { sort: { 'updatedAt': 1 } }).lean();
    return oldest;
}

/**
 * Refresh the exchange stock with its data.
 */
const refreshExchangeStock = async () => {
    const oldestStock = await getOldest(ExchangeStock);
    if (oldestStock) {
        console.log('(cron-daily) refreshing', oldestStock.name);
        const SS = new StockService();
        await SS.refreshStock(oldestStock.name);
    }
}

/**
 * Purge exchange stocks which are unused
 */
const removeUnusedExchangeItems = async () => {
    // get distinct 'used' assets and watchlist entries
    const [assetStocks, watchlistStocks, assetCryptos, watchlistCryptos, assetCash, watchlistCash] = await Promise.all([
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
        ExchangeStock.deleteMany({ '_id': { $nin: usedStocks } }),
        ExchangeCrypto.deleteMany({ '_id': { $nin: usedCryptos } }),
        ExchangeForex.deleteMany({ '_id': { $nin: usedCash } }),
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

/**
 * Refresh the exchange crypto with its data.
 */
const refreshExchangeCrypto = async () => {
    const oldestCrypto = await getOldest(ExchangeCrypto);
    if (oldestCrypto) {
        console.log('(cron-crypto) refreshing', oldestCrypto.name);
        const service = new CryptoService();
        await service.refreshCrypto(oldestCrypto.from, oldestCrypto.to);
    }
}

/**
 * Refresh the exchange forex with its data.
 */
const refreshExchangeCash = async () => {
    const oldestForex = await getOldest(ExchangeForex);
    if (oldestForex) {
        console.log('(cron-forex) refreshing', oldestForex.name);
        const service = new ForexService();
        await service.refreshForex(oldestForex.from, oldestForex.to);
    }
}

module.exports = {
    initialize: async () => {

        // initialize cron jobs for when the NYSE opens
        const timezone = {
            timezone: "America/New_York"
        }

        // 9:30 until 10:00 (NYT)
        const marketFirstHalfHour = '30-59/5 9 * * Mon-Fri';
        ncron.schedule(marketFirstHalfHour, refreshExchangeStock, timezone);

        // 10:00 until 16:00 (NYT)
        const marketRegularHours = '*/5 10-16 * * Mon-Fri';
        ncron.schedule(marketRegularHours, refreshExchangeStock, timezone);

        // 17:00 until 19:00 (NYT)
        const marketAfterMarket = '*/5 17,19 * * Mon-Fri';
        ncron.schedule(marketAfterMarket, refreshExchangeStock, timezone);

        // midnight until 1:00 (localtime)
        const startOfDay = '*/5 0 * * Mon-Sat';
        ncron.schedule(startOfDay, refreshExchangeCrypto);

        // 1:00 until 2:00 (localtime)
        const startOfDayPlusOne = '*/5 1 * * Mon-Sat';
        ncron.schedule(startOfDayPlusOne, refreshExchangeCash);

        // 5:00 until 10:00 weekend (localtime)
        const fromFiveToTenOclock = '*/5 5-12 * * Sat,Sun';
        ncron.schedule(fromFiveToTenOclock, refreshExchangeStock);

        // purge unused exchange items
        // everyday at 1:00 (localtime)
        const atOneOclock = '0 1 * * *';
        ncron.schedule(atOneOclock, removeUnusedExchangeItems);

        // update valid listings
        // once a week on Monday at 1:00 (localtime)
        const atOneOclockMonday = '0 1 * * Mon';
        ncron.schedule(atOneOclockMonday, updateValidListings);

        // complete
        console.log('Scheduler loaded!')
    }
};