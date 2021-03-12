const ExchangeForex = require('../models/cash/Exchange');
const ValidForex = require('../models/cash/Valid');
const forexProvider = require('./providers/alphavantageForexService');
const ExchangeCashEmitter = require('../events/exchangeCashEmitter');

class ForexService {

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
     * Return true if 'currency' is a valid 3-letter code.
     * @param {String} currency
     * @returns {Boolean}
     */
    async isCurrencyValid(currency) {
        return await ValidForex.exists({ code: currency });
    }

    /**
     * Return true if forex exchange from/to is in db.
     * @param {String} from 
     * @param {String} to 
     * @returns {Boolean}
     */
    async hasForex(from, to) {
        return await ExchangeForex.exists({ from, to });
    }

    /**
      * Return the ExchangeForex object for the forex exchange from/to.
      * @param {String} from 
      * @param {String} to
      * @returns {Document}
      */
    async getForex(from, to) {
        return await ExchangeForex.findOne({ from, to });
    }

    /**
     * Return the ExchangeForex object for the forex from/to after being updated with the most recent data.
     * @param {String} from
     * @param {String} to 
     * @returns {Document}
     */
    async refreshForex(from, to) {
        if (! await this.hasForex(from, to)) {
            throw Error(`Forex ${from}-${to} is not available`);
        }
        const [exchangeRateInst, exchangeDailyInst] = await Promise.all([
            forexProvider.fetchExchangeRate(from, to),
            forexProvider.fetchExchangeDaily(from, to)
        ]);
        const exForex = await ExchangeForex.findOneAndUpdate({ from, to }, {
            $set: {
                exchangeRate: exchangeRateInst,
                exchangeQuote: exchangeDailyInst[0],
                exchangeDaily: exchangeDailyInst,
            }
        });
        ExchangeCashEmitter.emit('refresh', exForex._id);
        return exForex;
    }
    
    /**
     * Create an existing or a newly created exchange forex document.
     * @param {String} from 
     * @param {String} to
     * @returns {Document}
     */
    async retrieveOrUpsert(from, to) {
        const [isFromValid, isToValid, hasForex] = await Promise.all([
            this.isCurrencyValid(from),
            this.isCurrencyValid(to),
            this.hasForex(from, to)
        ]);
        if (!isFromValid) {
            throw Error("controller:fromCurrency:That currency is invalid!");
        }
        else if (!isToValid) {
            throw Error("controller:toCurrency:That currency is invalid!");
        }
        else if (hasForex) {
            return await this.getForex(from, to);
        }
        else {
            const [exchangeRateInst, exchangeDailyInst, exchangeCalculatedInst] = await forexProvider.fetchAll(from, to);
            const exForex = await ExchangeForex.create({
                from,
                to,
                name: [from, to].join(' - '),
                longName: [exchangeRateInst.FromName, exchangeRateInst.ToName].join(' - '),
                exchangeRate: exchangeRateInst,
                exchangeQuote: exchangeDailyInst[0],
                exchangeDaily: exchangeDailyInst,
                exchangeCalculated: exchangeCalculatedInst,
            });
            ExchangeCashEmitter.emit('create', exForex._id);
            return exForex;
        }
    }

}

module.exports = ForexService
