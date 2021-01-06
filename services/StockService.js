const { default: chalk } = require('chalk');
const Asset = require('../models/stock/Asset');
const ExchangeStock = require('../models/stock/Exchange');
const stockProvider = require('./providers/alphavantageService');

class StockService {

    /**
     * Return true if 'ticker' is valid.
     * @param {String} ticker
     * @returns {Boolean}
     */
    async isTickerValid(ticker) {
        return await stockProvider.isTickerValid(ticker);
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
     * Returns true if the refresh rate has elapsed since the last update.
     * @param {Date} lastUpdate 
     * @param {Number} refreshRate
     * @returns {Boolean}
     */
    #needsUpdate(lastUpdate, refreshRate) {
        const now = mongoose.now();
        return (now.getTime() > (lastUpdate.getTime() + refreshRate));
    }

    /**
     * Return the ExchangeStock object for the 'ticker'. Before returning to caller, the ExchangeStock
     * object is refreshed with the latest information based on the refresh rate of each field.
     * @param {String} ticker 
     * @returns {ExchangeStock}
     */
    async getAndRefreshStock(ticker) {
        if (! await this.hasStock(ticker)) {
            throw Error(`Ticker '${ticker}' is not available`);
        }

        // get it
        let exData = await this.getStock(ticker);
        let needsSave = false;

        // check if exchangeOverview needs to be refreshed
        if (this.#needsUpdate(exData.exchangeOverview.updatedAt, exData.exchangeOverviewRefreshRate)) {
            console.log('exchangeOverview needs refreshing');
            try {
                const data = await stockProvider.fetchExchangeOverview(ticker);
                exData.exchangeOverview = data;
                needsSave = true;
            } catch (err) {
                console.error(err);
            }
        }

        // check if exchangeQuote needs to be refreshed
        if (this.#needsUpdate(exData.exchangeQuote.updatedAt, exData.exchangeQuoteRefreshRate)) {
            console.log('exchangeQuote needs refreshing');
            try {
                const data = await stockProvider.fetchExchangeQuote(ticker);
                exData.exchangeQuote = data;
                needsSave = true;
            } catch (err) {
                console.error(err);
            }
        }

        /*
        
        Skip these for now!


        // check if exchangeIntraday needs to be refreshed
        if (this.#needsUpdate(exData.exchangeIntraday.updatedAt, exData.exchangeIntradayRefreshRate)) {
            console.log('exchangeIntraday needs refreshing');
            try {
                const data = await stockProvider.fetchExchangeIntraday(ticker);
                exData.exchangeIntraday = [];
                exData.exchangeIntraday.push(data);
                needsSave = true;
            } catch (err) {
                console.error(err);
            }
        }

        // check if exchangeDaily needs to be refreshed
        if (this.#needsUpdate(exData.exchangeDaily.updatedAt, exData.exchangeDailyRefreshRate)) {
            console.log('exchangeDaily needs refreshing');
            try {
                const data = await stockProvider.fetchExchangeDaily(ticker);
                exData.exchangeDaily = [];
                exData.exchangeDaily.push(data);
                needsSave = true;
            } catch (err) {
                console.error(err);
            }
        }
        */

        // save before exiting
        if (needsSave) {
            exData = await exData.save();
        }
        return exData;
    }

    /**
     * Create a new ExchangeStock object iff it does not already exist. If it exists, then the existing object is returned.
     * @param {String} ticker
     * @returns {ExchangeStock}
     */
    async createStock(ticker) {
        if (await this.hasStock(ticker)) {
            console.info(`Ticker '${ticker}' already exists - no need to create!`);
            return this.getStock(ticker);
        } else {
            try {
                // for now
                const [exchangeOverviewInst, exchangeQuoteInst] = await stockProvider.fetchAll(ticker);
                const exchangeIntradayInst = [], exchangeDailyInst = [];
                // const { exchangeOverview, exchangeQuote, exchangeIntraday, exchangeDaily } = await stockProvider.fetchAll(ticker);
                console.trace(chalk.red(exchangeOverviewInst));
                console.trace(chalk.red(exchangeQuoteInst));
                const exStock = new ExchangeStock({
                    name: ticker,
                    exchangeOverview: exchangeOverviewInst,
                    exchangeQuote: exchangeQuoteInst,
                    exchangeIntraday: exchangeIntradayInst,
                    exchangeDaily: exchangeDailyInst
                });
                console.trace(chalk.red(exStock));
                return exStock.save();
            } catch (err) {
                console.error(err);
                return null;
            }
        }
    }
}

module.exports = StockService
