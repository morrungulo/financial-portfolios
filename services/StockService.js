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
     * @param {exchangeOverviewInst} overview
     * @param {exchangeQuoteInst} quote
     */
    exchangeCalculated(overview, quote) {
        const result = {
            DividendYieldPercent: 0,        // 100*(overview.dividend/quote.price)
            DividendPayoutRatioPercent: 0,  // 100*(1-(overview.EPS-overview.dividend)/overview.EPS)
            Week52RangePercent: 0,          // 100*((quote.price - overview.week52low) / (overview.week52high - overview.week52low))
        };
        // result.DividendYieldPercent = 100 * (overview.Dividend / quote.Price);
        // if (overview.EPS != 0) {
        //     result.DividendPayoutRatioPercent = 100 * (1 - (overview.EPS - overview.Dividend) / overview.EPS);
        // }
        // result.Week52RangePercent = 100 * ((quote.Price - overview.Week52Low) / (overview.Week52High - overview.Week52Low));
        return result;
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
        const [exchangeOverviewInst, exchangeQuoteInst, exchangeDailyInst] = await stockProvider.fetchAll(ticker);
        const exStock = await ExchangeStock.findOneAndUpdate({ name: ticker }, {
            $set: {
                exchangeOverview: exchangeOverviewInst,
                exchangeQuote: exchangeQuoteInst,
                exchangeCalculated: this.exchangeCalculated(exchangeOverviewInst, exchangeQuoteInst),
                exchangeDaily: exchangeDailyInst
            }
        });
        ExchangeStockEmitter.emit('update_daily', exStock._id);
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
                const [exchangeOverviewInst, exchangeQuoteInst, exchangeDailyInst] = await stockProvider.fetchAll(ticker);
                const exStock = await ExchangeStock.create({
                    name: ticker,
                    exchangeOverview: exchangeOverviewInst,
                    exchangeQuote: exchangeQuoteInst,
                    exchangeCalculated: this.exchangeCalculated(exchangeOverviewInst, exchangeQuoteInst),
                    exchangeDaily: exchangeDailyInst,
                });
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
