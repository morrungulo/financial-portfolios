const ExchangeStock = require('../models/stock/Exchange');
const ValidStock = require('../models/stock/Valid');
const stockProvider = require('./providers/alphavantageStockService');
const ExchangeStockEmitter = require('../events/exchangeStockEmitter');

class StockService {

    /**
     * Update the valid stock listings.
     */
    async updateValidStockListing() {
        try {
            const result = await stockProvider.fetchValidListing();
            const mapped = result.map(entry => {
                return { code: entry.symbol, name: entry.name };
            });
            await ValidStock.deleteMany({});
            await ValidStock.insertMany(mapped);
        } catch (err) {
            console.error('Unable to update valid stock listing');
        }
    }

    /**
     * Return true if 'ticker' is valid.
     * @param {String} ticker
     * @returns {Boolean}
     */
    async isTickerValid(ticker) {
        return await ValidStock.exists({ code: ticker });
    }

    /**
     * Return true if 'ticker' is in db.
     * @param {String} ticker
     * @returns {Boolean} 
     */
    async hasStock(ticker) {
        return await ExchangeStock.exists({ name: ticker });
    }

    /**
     * Return the ExchangeStock object for the 'ticker'. 
     * @param {String} ticker 
     * @returns {ExchangeStock}
     */
    async getStock(ticker) {
        return await ExchangeStock.findOne({ name: ticker });
    }

    /**
     * Return the ExchangeStock object for the 'ticker' after being updated with the most recent data.
     * @param {String} ticker 
     * @returns {ExchangeStock}
     */
    async refreshStock(ticker) {
        if (! await this.hasStock(ticker)) {
            throw Error(`Ticker '${ticker}' is not available`);
        }
        const [exchangeOverviewInst, exchangeQuoteInst, exchangeDailyInst] = await Promise.all([
            stockProvider.fetchExchangeOverview(ticker),
            stockProvider.fetchExchangeQuote(ticker),
            stockProvider.fetchExchangeDaily(ticker),
        ]);
        const exStock = await ExchangeStock.findOneAndUpdate({ name: ticker }, {
            $set: {
                exchangeOverview: exchangeOverviewInst,
                exchangeQuote: exchangeQuoteInst,
                exchangeDaily: exchangeDailyInst
            }
        });
        ExchangeStockEmitter.emit('refresh', exStock._id);
        return exStock;
    }

    /**
     * Create an existing or a newly created exchange stock document.
     * @param {String} ticker 
     * @returns {Document}
     */
    async retrieveOrUpsert(ticker) {
        const [isTickerValid, hasStock] = await Promise.all([
            this.isTickerValid(ticker),
            this.hasStock(ticker)
        ]);
        if (!isTickerValid) throw Error("controller:ticker:That ticker is invalid!");
        if (hasStock) return await this.getStock(ticker);

        // create new
        const [exchangeOverviewInst, exchangeQuoteInst, exchangeDailyInst, exchangeCalculatedInst] = await stockProvider.fetchAll(ticker);
        const exStock = await ExchangeStock.create({
            name: ticker,
            exchangeOverview: exchangeOverviewInst,
            exchangeQuote: exchangeQuoteInst,
            exchangeDaily: exchangeDailyInst,
            exchangeCalculated: exchangeCalculatedInst,
        });
        ExchangeStockEmitter.emit('create', exStock._id);
        return exStock;
    }

}

module.exports = StockService
