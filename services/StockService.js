const chalk = require('chalk');
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
     * Return the ExchangeStock object for the 'ticker' after being updated with the most recent quote.
     * @param {String} ticker 
     * @returns {ExchangeStock}
     */
    async refreshStockQuote(ticker) {
        if (! await this.hasStock(ticker)) {
            throw Error(`Ticker '${ticker}' is not available`);
        }

        // get it
        let exData = await this.getStock(ticker);
        let needsSave = false;
        try {
            // fetch quote
            const exchangeQuoteInst = await stockProvider.fetchExchangeQuote(ticker);
            exData.exchangeQuote = exchangeQuoteInst;
            needsSave = true;
        } catch (error) {
            console.log('Not possible to retrieve ' + ticker);
        }

        // save if 
        if (needsSave) {
           exData = await exData.save();
        }

        return exData;
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
        let exData = await this.getStock(ticker);
        let needsSave = false;
        try {
            // fetch overview
            const exchangeOverviewInst = await stockProvider.fetchExchangeOverview(ticker);
            exData.exchangeOverview = exchangeOverviewInst;
            needsSave = true;

            // fetch daily
            const exchangeDailyInst = await stockProvider.fetchExchangeDaily(ticker);
            exData.exchangeDaily = exchangeDailyInst;
        } catch (error) {
            console.log('Not possible to retrieve ' + ticker);
        }

        // save before exiting
        if (needsSave) {
           exData = await exData.save();
        }
        return exData;
    }

    async buildChartDataFromDailyData(ticker) {
        const criteria = { name: ticker };
        const data = await ExchangeStock.aggregate([
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
                return exStock;
            } catch (err) {
                console.error(err);
                return null;
            }
        }
    }
}

module.exports = StockService
