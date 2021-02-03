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

    // /**
    //  * Returns true if the refresh rate has elapsed since the last update.
    //  * @param {Date} lastUpdate 
    //  * @param {Number} refreshRate
    //  * @returns {Boolean}
    //  */
    // #needsUpdate(lastUpdate, refreshRate) {
    //     const now = mongoose.now();
    //     return (now.getTime() > (lastUpdate.getTime() + refreshRate));
    // }

    // /**
    //  * Return the ExchangeStock object for the 'ticker'. Before returning to caller, the ExchangeStock
    //  * object is refreshed with the latest information based on the refresh rate of each field.
    //  * @param {String} ticker 
    //  * @returns {ExchangeStock}
    //  */
    // async getAndRefreshStock(ticker) {
    //     if (! await this.hasStock(ticker)) {
    //         throw Error(`Ticker '${ticker}' is not available`);
    //     }

    //     // get it
    //     let exData = await this.getStock(ticker);
    //     let needsSave = false;

    //     // check if exchangeOverview needs to be refreshed
    //     if (this.#needsUpdate(exData.exchangeOverview.updatedAt, exData.exchangeOverviewRefreshRate)) {
    //         console.info('exchangeOverview needs refreshing');
    //         try {
    //             const data = await stockProvider.fetchExchangeOverview(ticker);
    //             exData.exchangeOverview = data;
    //             needsSave = true;
    //         } catch (err) {
    //             console.error(err);
    //         }
    //     }

    //     // check if exchangeQuote needs to be refreshed
    //     if (this.#needsUpdate(exData.exchangeQuote.updatedAt, exData.exchangeQuoteRefreshRate)) {
    //         console.info('exchangeQuote needs refreshing');
    //         try {
    //             const data = await stockProvider.fetchExchangeQuote(ticker);
    //             exData.exchangeQuote = data;
    //             needsSave = true;
    //         } catch (err) {
    //             console.error(err);
    //         }
    //     }

    //     /*
        
    //     Skip these for now!


    //     // check if exchangeIntraday needs to be refreshed
    //     if (this.#needsUpdate(exData.exchangeIntraday.updatedAt, exData.exchangeIntradayRefreshRate)) {
    //         console.log('exchangeIntraday needs refreshing');
    //         try {
    //             const data = await stockProvider.fetchExchangeIntraday(ticker);
    //             exData.exchangeIntraday = [];
    //             exData.exchangeIntraday.push(data);
    //             needsSave = true;
    //         } catch (err) {
    //             console.error(err);
    //         }
    //     }

    //     // check if exchangeDaily needs to be refreshed
    //     if (this.#needsUpdate(exData.exchangeDaily.updatedAt, exData.exchangeDailyRefreshRate)) {
    //         console.log('exchangeDaily needs refreshing');
    //         try {
    //             const data = await stockProvider.fetchExchangeDaily(ticker);
    //             exData.exchangeDaily = [];
    //             exData.exchangeDaily.push(data);
    //             needsSave = true;
    //         } catch (err) {
    //             console.error(err);
    //         }
    //     }
    //     */

    //     // save before exiting
    //     if (needsSave) {
    //         exData = await exData.save();
    //     }
    //     return exData;
    // }

    async retrieveDailyData(ticker) {
        const criteria = { name: ticker };
        const group = { $group: { _id: '$name', xdata: { $push: '$x' }, ydata: { $push: '$y' } } };    
        const project = { $project: { _id: false, xdata: true, ydata: true, name: true } };
        const data = await ExchangeStock.aggregate([
            { $match: criteria },
            { $unwind: '$exchangeDaily' },
            {
                $project: {
                    _id: true,
                    name: true,
                    x: '$exchangeDaily.LastRefreshed',
                    y: '$exchangeDaily.Close',
                }
            },
            { $sort: { 'x': 1 } },
            {
                $facet: {
                    "1W": [ { $limit: 5 }, group, project ],
                    "2W": [ { $limit: 10 }, group, project ],
                    "1M": [ { $limit: 30*5/7 }, group, project ],
                    "3M": [ { $limit: 90*5/7 }, group, project ],
                    "6M": [ { $limit: 180*5/7 }, group, project ],
                    "1Y": [ { $limit: 365*5/7 }, group, project ],
                    "2Y": [ { $limit: 365*2*5/7 }, group, project ],
                    "5Y": [ { $limit: 365*5*5/7 }, group, project ],
                    "All": [ group, project ],
                }
            }
        ]);
        console.log(chalk.cyan(JSON.stringify(data, null, "  ")));

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


                const [graphData]= await retrieveDailyData(ticker);


                // produce graphs
                return exStock;
            } catch (err) {
                console.error(err);
                return null;
            }
        }
    }
}

module.exports = StockService
