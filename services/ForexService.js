const ExchangeCash = require('../models/cash/Exchange');
const ValidForex = require('../models/cash/Valid');
const forexProvider = require('./providers/alphavantageForexService');
const ExchangeCashEmitter = require('../events/exchangeCashEmitter');

class ForexService {

    /**
     * Return true if 'currency' is a valid 3-letter code.
     * @param {String} currency
     * @returns {Boolean}
     */
    async isCurrencyValid(currency) {
        return await ValidForex.exists({ code: currency });
    }

    /**
     * Update the valid forex listing.
     */
    async updateValidForexListing() {
        try {
            const result = await forexProvider.fetchValidListing();
            const mapped = result.map(entry => {
                return { code: entry['currency code'], name: entry['currency name'] };
            });
            await ValidForex.deleteMany({});
            await ValidForex.insertMany(mapped);
        } catch (err) {
            console.error('Unable to update valid forex listing');
        }
    }

    /**
     * Return true if forex exchange from/to is in db.
     * @param {String} from 
     * @param {String} to 
     * @returns {Boolean}
     */
    async hasForex(from, to) {
        return await ExchangeCash.exists({ from, to });
    }

    /**
      * Return the ExchangeCash object for the forex exchange from/to.
      * @param {String} from 
      * @param {String} to
      * @returns {ExchangeCash}
      */
    async getForex(from, to) {
        return await ExchangeCash.findOne({ from, to });
    }

    /**
     * Return the ExchangeCash object for the forex exchange from/to after being updated with the most recent data.
     * @param {String} from
     * @param {String} to 
     * @returns {ExchangeCash}
     */
    async refreshForex(from, to, updateRateOnly=true) {
        if (! await this.hasForex(from, to)) {
            throw Error(`Forex exchange ${from}-${to} is not available`);
        }

        // get it
        let exForex = await this.getForex(from, to);
        let needsSave = false;
        try {
            // fetch rate
            if (updateRateOnly) {
                const exchangeRateInst = await forexProvider.fetchExchangeRate(from, to);
                needsSave = (exForex.rate != exchangeRateInst.Rate);
                exForex.rate = exchangeRateInst.Rate;
            } else {
                const [exchangeRateInst, exchangeDailyInst] = await forexProvider.fetchAll(from, to);
                exForex.rate = exchangeRateInst.Rate;
                exForex.exchangeDaily = exchangeDailyInst;
                needsSave = true;
            }
        } catch (err) {
            console.log(`Not possible to retrieve forex ${from}-${to} due to ${err}!`);
        }

        if (needsSave) {
            exForex = await exForex.save();
            if (!updateRateOnly) {
                ExchangeCashEmitter.emit('update_daily', exForex._id);
            }
        }

        return exForex;
    }

    /**
     * Create a new ExchangeCash object for the forex exchange from/to.
     * @param {String} from 
     * @param {String} to 
     */
    async createForex(from, to) {
        if (await this.hasForex(from, to)) {
            console.warn(`Forex exchange '${from}-${to}' already exists - no need to create!`);
            return this.getForex(from, to);
        } else {
            try {
                const [exchangeRateInst, exchangeDailyInst] = await forexProvider.fetchAll(from, to);
                const exForex = new ExchangeCash({
                    from,
                    to,
                    rate: exchangeRateInst.Rate,
                    exchangeDaily: exchangeDailyInst,
                });
                await exForex.save();
                ExchangeCashEmitter.emit('create', exForex._id);
                return exForex;
            } catch (err) {
                console.error(err);
                return null;
            }
        }
    }
}

module.exports = ForexService
