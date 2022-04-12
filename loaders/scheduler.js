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
    console.log('(cron) remove unused items');

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
    console.log('(cron) updating listings');

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
        return new Promise((resolve, reject) => {

            // initialize cron jobs for when the NYSE opens
            const options = {
                timezone: "America/New_York"
            };

            // stock market timezone
            {
                // 9:30 until 10:00 (NYT)
                const marketFirstHalfHour = '30-59/5 9 * * Mon-Fri';
                ncron.schedule(marketFirstHalfHour, refreshExchangeStock, options);

                // 10:00 until 16:00 (NYT)
                const marketRegularHours = '*/5 10-16 * * Mon-Fri';
                ncron.schedule(marketRegularHours, refreshExchangeStock, options);

                // 17:00 until 19:00 (NYT)
                const marketAfterMarket = '*/5 17,19 * * Mon-Fri';
                ncron.schedule(marketAfterMarket, refreshExchangeStock, options);
            }

            // local timezone
            {
                // daily
                {
                    // every 20min from 10h until 23h everyday
                    const every20mFrom10hTo23h = '*/20 10-23 * * *';
                    ncron.schedule(every20mFrom10hTo23h, refreshExchangeCrypto);

                    // @14:00 (localtime)
                    const at1pm = '0-30/5 13 * * Mon-Fri';
                    ncron.schedule(at1pm, refreshExchangeCash);

                    // purge unused exchange items
                    // everyday at 10am (localtime)
                    const at10am = '0 10 * * *';
                    ncron.schedule(at10am, removeUnusedExchangeItems);
                }

                // weekend
                {
                    // 10:00 until 15:00 weekend (localtime)
                    const from10to16weekends = '*/5 10-16 * * Sat,Sun';
                    ncron.schedule(from10to16weekends, refreshExchangeStock);

                    // update valid listings
                    // once a week on Sunday at 22:00 (localtime)
                    const onSundayEvening = '0 22 * * Sun';
                    ncron.schedule(onSundayEvening, updateValidListings);
                }
            }

            // complete
            console.log('Scheduler loaded!')
            resolve();
        });
    }
};