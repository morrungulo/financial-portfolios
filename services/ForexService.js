const ExchangeForex = require('../models/cash/Exchange');
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
        return await ExchangeForex.exists({ from, to });
    }

    /**
      * Return the ExchangeForex object for the forex exchange from/to.
      * @param {String} from 
      * @param {String} to
      * @returns {ExchangeCash}
      */
    async getForex(from, to) {
        return await ExchangeForex.findOne({ from, to });
    }

    /**
     * Calculate the change and change percentage from daily
     * @param {exchangeDailyInst} daily 
     */
    exchangeCalculated(daily) {
        const result = { Change: 0, ChangePercent: 0 };
        if (daily.length >= 2) {
            result.Change = daily[0].Close - daily[1].Close;
            result.ChangePercent = (result.Change / daily[1].Close) * 100;
        }
        return result;
    }

    /**
     * Return the ExchangeForex object for the forex exchange from/to after being updated with the most recent data.
     * @param {String} from
     * @param {String} to 
     * @returns {ExchangeForex}
     */
    async refreshForex(from, to, updateRateOnly=true) {
        if (! await this.hasForex(from, to)) {
            throw Error(`Forex exchange ${from}-${to} is not available`);
        }
        const [exchangeRateInst, exchangeDailyInst] = await forexProvider.fetchAll(from, to);
        const exForex = await ExchangeForex.findOneAndUpdate({ from, to }, {
            $set: {
                exchangeRate: exchangeRateInst,
                exchangeQuote: exchangeDailyInst[0],
                exchangeCalculated: this.exchangeCalculated(exchangeDailyInst),
                exchangeDaily: exchangeDailyInst,
            }
        });
        ExchangeCashEmitter.emit('update_daily', exForex._id);
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
                const exForex = ExchangeForex.create({
                    from,
                    to,
                    name: [from, to].join(' - '),
                    longName: [exchangeRateInst.FromName, exchangeRateInst.ToName].join(' - '),
                    exchangeRate: exchangeRateInst,
                    exchangeQuote: exchangeDailyInst[0],
                    exchangeCalculated: this.exchangeCalculated(exchangeDailyInst),
                    exchangeDaily: exchangeDailyInst,
                });
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
