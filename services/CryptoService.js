const ExchangeCrypto = require('../models/crypto/Exchange');
const ValidCrypto = require('../models/crypto/Valid');
const cryptoProvider = require('./providers/alphavantageCryptoService');
const ExchangeCryptoEmitter = require('../events/exchangeCryptoEmitter');
const ForexService = require('./ForexService');

const chalk = require('chalk')

class CryptoService {

    /**
     * Update the valid crypto listing.
     */
    async updateValidCryptoListing() {
        try {
            const data = await cryptoProvider.fetchValidListing();
            await ValidCrypto.deleteMany({});
            await ValidCrypto.insertMany(data);
        } catch (err) {
            console.error('Unable to update valid crypto listing: ' + err);
        }
    }

    /**
     * Return true if 'currency' is a valid digital currency code.
     * @param {String} code
     * @returns {Boolean}
     */
    async isCryptoValid(code) {
        return await ValidCrypto.exists({ code });
    }

    /**
     * Return 
     * @param {String} currency 
     * @returns ValidCrypto entry or null
     */
    async getFromValidCrypto(code) {
        return await ValidCrypto.findOne({ code })
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
     */
    async refreshCrypto(from, to) {
        if (! await this.hasCrypto(from, to)) {
            throw Error(`Digital exchange ${from}-${to} is not available`);
        }
        try {
            const valid = await this.getFromValidCrypto(from);
            const [exchangeDailyInst, exchangeOverviewInst] = await Promise.all([
                cryptoProvider.fetchExchangeDaily(valid.name, to),
                cryptoProvider.fetchExchangeOverview(valid.name, to)
            ]);
            const exCrypto = await ExchangeCrypto.findOneAndUpdate({ from, to }, {
                $set: {
                    exchangeOverview: exchangeOverviewInst,
                    exchangeQuote: exchangeDailyInst[0],
                    exchangeDaily: exchangeDailyInst,
                }
            });
            ExchangeCryptoEmitter.emit('refresh', exCrypto._id);
        } catch (error) {
            console.error('Error occurred fetching crypto data', error.message)
        }
    }

    /**
     * Create an existing or a newly created exchange crypto document.
     * @param {String} from 
     * @param {String} to
     * @returns {Document}
     */
    async retrieveOrUpsert(from, to) {
        const forexService = new ForexService();
        const [isFromValid, isToValid, hasCrypto] = await Promise.all([
            this.isCryptoValid(from),
            forexService.isCurrencyValid(to),
            this.hasCrypto(from, to)
        ]);
        if (!isFromValid) throw Error("controller:fromCrypto:That crypto is invalid!");
        if (!isToValid) throw Error("controller:toCrypto:That currency is invalid!");
        if (hasCrypto) return await this.getCrypto(from, to);

        // create new
        const valid = await this.getFromValidCrypto(from);
        const [exchangeRateInst, exchangeDailyInst, exchangeCalculatedInst, exchangeOverviewInst] = await cryptoProvider.fetchAll(valid.name, to);
        const exCrypto = await ExchangeCrypto.create({
            from,
            to,
            name: [from.toUpperCase(), to.toUpperCase()].join(' - '),
            longName: [exchangeOverviewInst.Name, to.toUpperCase()].join(' - '),
            exchangeOverview: exchangeOverviewInst,
            exchangeRate: exchangeRateInst,
            exchangeQuote: exchangeDailyInst[0],
            exchangeDaily: exchangeDailyInst,
            exchangeCalculated: exchangeCalculatedInst,
        });
        ExchangeCryptoEmitter.emit('create', exCrypto._id);
        return exCrypto;
    }

}

module.exports = CryptoService
