const ExchangeStock = require('../models/stock/Exchange');
const ValidStock = require('../models/stock/Valid');
const stockProvider = require('./providers/alphavantageStockService');
const ExchangeStockEmitter = require('../events/exchangeStockEmitter');

class StockService {

    /**
     * Return true if 'ticker' is valid.
     * @param {String} ticker
     * @returns {Boolean}
     */
    async isTickerValid(ticker) {
        return await ValidStock.exists({ code: ticker });
    }

    /**
     * Update the valid stock listings.
     */
    async updateValidStockListing() {
        try {
            const result = await stockProvider.fetchValidListing();
            console.log(JSON.stringify(result));
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
     * Return the ExchangeStock object for the 'ticker' after being updated with the most recent quote.
     * @param {String} ticker 
     * @returns {ExchangeStock}
     */
    async refreshStockQuote(ticker) {
        if (! await this.hasStock(ticker)) {
            throw Error(`Ticker '${ticker}' is not available`);
        }

        // get it
        let exStock = await this.getStock(ticker);
        let needsSave = false;
        try {
            // fetch quote
            const exchangeQuoteInst = await stockProvider.fetchExchangeQuote(ticker);
            exStock.exchangeQuote = exchangeQuoteInst;
            needsSave = true;
        } catch (error) {
            console.log('Not possible to retrieve ' + ticker);
        }

        // save before exiting
        if (needsSave) {
            exStock = await exStock.save();
            ExchangeStockEmitter.emit('update_quote', exStock._id);
        }

        return exStock;
    }


    /**
     * Return the ExchangeStock object for the 'ticker' after being updated with the most recent overview and daily data.
     * @param {String} ticker 
     * @returns {ExchangeStock}
     */
    async refreshStockOverviewAndDaily(ticker) {
        if (! await this.hasStock(ticker)) {
            throw Error(`Ticker '${ticker}' is not available`);
        }

        // get it
        let exStock = await this.getStock(ticker);
        let needsSave = false;
        try {
            // fetch overview
            const exchangeOverviewInst = await stockProvider.fetchExchangeOverview(ticker);
            exStock.exchangeOverview = exchangeOverviewInst;
            needsSave = true;

            // fetch daily
            const exchangeDailyInst = await stockProvider.fetchExchangeDaily(ticker);
            exStock.exchangeDaily = exchangeDailyInst;
        } catch (err) {
            console.log(`Not possible to retrieve ${ticker} due to ${err}!`);
        }

        // save before exiting
        if (needsSave) {
            exStock = await exStock.save();
            ExchangeStockEmitter.emit('update_daily', exStock._id);
        }
        return exStock;
    }


    /**
     * Create a new ExchangeStock object iff it does not already exist. If it exists, then the existing object is returned.
     * @param {String} ticker
     * @returns {ExchangeStock}
     */
    async createStock(ticker) {
        if (await this.hasStock(ticker)) {
            console.warn(`Ticker '${ticker}' already exists - no need to create!`);
            return this.getStock(ticker);
        } else {
            try {
                // for now
                const [exchangeOverviewInst, exchangeQuoteInst, exchangeCalculatedInst, exchangeDailyInst] = await stockProvider.fetchAll(ticker);
                // const exchangeIntradayInst = [], exchangeDailyInst = [];
                // const { exchangeOverview, exchangeQuote, exchangeIntraday, exchangeDaily } = await stockProvider.fetchAll(ticker);
                const exStock = new ExchangeStock({
                    name: ticker,
                    exchangeOverview: exchangeOverviewInst,
                    exchangeQuote: exchangeQuoteInst,
                    exchangeCalculated: exchangeCalculatedInst,
                    // exchangeIntraday: exchangeIntradayInst,
                    exchangeDaily: exchangeDailyInst,
                });
                await exStock.save();
                ExchangeStockEmitter.emit('create', exStock._id);
                return exStock;
            } catch (err) {
                console.error(err);
                return null;
            }
        }
    }
}

module.exports = StockService
