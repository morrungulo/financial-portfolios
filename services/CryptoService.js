const ExchangeCrypto = require('../models/crypto/Exchange');
const ValidCrypto = require('../models/crypto/Valid');
const cryptoProvider = require('./providers/alphavantageCryptoService');
const ExchangeCryptoEmitter = require('../events/exchangeCryptoEmitter');
const ValidForex = require('../models/cash/Valid');

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
    async refreshCrypto(from, to, updateRateOnly=true) {
        if (! await this.hasCrypto(from, to)) {
            throw Error(`Digital exchange ${from}-${to} is not available`);
        }

        // get it
        let exCrypto = await this.getCrypto(from, to);
        let needsSave = false;
        try {
            // fetch rate
            if (updateRateOnly) {
                const exchangeRateInst = await cryptoProvider.fetchExchangeRate(from, to);
                exCrypto.rate = exchangeRateInst;
                needsSave = true;
            } else {
                const [exchangeRateInst, exchangeDailyInst] = await cryptoProvider.fetchAll(from, to);
                exCrypto.exchangeRate = exchangeRateInst;
                exCrypto.exchangeQuote = exchangeDailyInst[0];
                exCrypto.exchangeDaily = exchangeDailyInst;
                needsSave = true;
            }
        } catch (err) {
            console.log(`Not possible to retrieve crypto ${from}-${to} due to ${err}!`);
        }

        if (needsSave) {
            exCrypto = await exCrypto.save();
            if (!updateRateOnly) {
                ExchangeCryptoEmitter.emit('update_daily', exCrypto._id);
            }
        }

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
                const [exchangeRateInst, exchangeCalculatedInst, exchangeDailyInst] = await cryptoProvider.fetchAll(from, to);
                const exCrypto = new ExchangeCrypto({
                    from,
                    to,
                    shortName: [from, to].join(' - '),
                    longName: [exchangeRateInst.FromName, exchangeRateInst.ToName].join(' - '),
                    exchangeRate: exchangeRateInst,
                    exchangeQuote: exchangeDailyInst[0],
                    exchangeCalculated: exchangeCalculatedInst,
                    exchangeDaily: exchangeDailyInst,
                });
                await exCrypto.save();
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
