const ExchangeStock = require('../models/stock/Exchange');
const ExchangeCrypto = require('../models/crypto/Exchange');
const ExchangeForex = require('../models/cash/Exchange');

/**
 * Create common definitions.
 * @param {mongoose.Model} dbmodel 
 * @param {String} name 
 * @returns An object with several definitions.
 */
const defineCommonLocals = (dbmodel, name) => {
    const lowercase = name.toLowerCase();
    return {
        dbmodel,
        name: lowercase,
        url: lowercase,
    };
}

const provideExchangeStock = (req, res, next) => {
    res.locals.exchange = defineCommonLocals(ExchangeStock, 'stock');
    next();
};

const provideExchangeCrypto = (req, res, next) => {
    res.locals.exchange = defineCommonLocals(ExchangeCrypto, 'crypto');
    next();
};

const provideExchangeForex = (req, res, next) => {
    res.locals.exchange = defineCommonLocals(ExchangeForex, 'cash');
    next();
};

module.exports = { provideExchangeStock, provideExchangeCrypto, provideExchangeForex };