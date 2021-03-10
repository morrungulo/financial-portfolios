const ExchangeCrypto = require('../models/crypto/Exchange');
const ValidCrypto = require('../models/crypto/Valid');
const cryptoProvider = require('./providers/alphavantageCryptoService');
const ExchangeCryptoEmitter = require('../events/exchangeCryptoEmitter');

class CryptoService {

    /**
     * Return true if 'currency' is a valid digital currency code.
     * @param {String} currency
     * @returns {Boolean}
     */
    async isCryptoValid(currency) {
        return await ValidCrypto.exists({ code: currency });
    }

    /**
     * Update the valid crypto listing.
     */
    async updateValidCryptoListing() {
        try {
            const result = await cryptoProvider.fetchValidListing();
            const mapped = result.map(entry => {
                return { code: entry['currency code'], name: entry['currency name'] };
            });
            await ValidCrypto.deleteMany({});
            await ValidCrypto.insertMany(mapped);
        } catch (err) {
            console.error('Unable to update valid crypto listing');
        }
    }

    /**
     * Return true if digital exchange from/to is in db.
     * @param {String} from 
     * @param {String} to 
     * @returns {Boolean}
     */
    async hasCrypto(from, to) {
        return await ExchangeCrypto.exists({ from, to });
    }

    /**
      * Return the ExchangeCrypto object for the forex exchange from/to.
      * @param {String} from 
      * @param {String} to
      * @returns {ExchangeCash}
      */
    async getCrypto(from, to) {
        return await ExchangeCrypto.findOne({ from, to });
    }

    /**
     * Return the ExchangeCrypto object for the digital exchange from/to after being updated with the most recent data.
     * @param {String} from
     * @param {String} to 
     * @returns {ExchangeCrypto}
     */
    async refreshCrypto(from, to) {
        if (! await this.hasCrypto(from, to)) {
            throw Error(`Digital exchange ${from}-${to} is not available`);
        }
        const [exchangeRateInst, exchangeDailyInst] = await Promise.all([
            cryptoProvider.fetchExchangeRate(from, to),
            cryptoProvider.fetchExchangeDaily(from, to)
        ]);
        const exCrypto = await ExchangeCrypto.findOneAndUpdate({ from, to }, {
            $set: {
                exchangeRate: exchangeRateInst,
                exchangeQuote: exchangeDailyInst[0],
                exchangeDaily: exchangeDailyInst,
            }
        });
        ExchangeCryptoEmitter.emit('refresh', exCrypto._id);
        return exCrypto;
    }

    /**
     * Create a new ExchangeCrypto object for the digital exchange from/to.
     * @param {String} from 
     * @param {String} to 
     */
    async createCrypto(from, to) {
        if (await this.hasCrypto(from, to)) {
            console.warn(`Digital exchange '${from}-${to}' already exists - no need to create!`);
            return this.getCrypto(from, to);
        } else {
            try {
                const [exchangeRateInst, exchangeDailyInst, exchangeCalculatedInst] = await cryptoProvider.fetchAll(from, to);
                const exCrypto = await ExchangeCrypto.create({
                    from,
                    to,
                    name: [from, to].join(' - '),
                    longName: [exchangeRateInst.FromName, exchangeRateInst.ToName].join(' - '),
                    exchangeRate: exchangeRateInst,
                    exchangeQuote: exchangeDailyInst[0],
                    exchangeDaily: exchangeDailyInst,
                    exchangeCalculated: exchangeCalculatedInst,
                });
                ExchangeCryptoEmitter.emit('create', exCrypto._id);
                return exCrypto;
            } catch (err) {
                console.error(err);
                return null;
            }
        }
    }
}

module.exports = CryptoService
