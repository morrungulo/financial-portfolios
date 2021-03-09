const AssetStock = require('../models/stock/Asset');
const AssetCrypto = require('../models/crypto/Asset');
const AssetCash = require('../models/cash/Asset');

/**
 * Create common definitions.
 * @param {mongoose.Model} dbmodel 
 * @param {String} name 
 * @returns An object with several definitions.
 */
const defineCommonLocals = (dbmodel, name) => {
    const singularLC = name.toLowerCase();
    return {
        dbmodel,
        singular: singularLC,
        url: singularLC + 's',
    };
}

const provideAssetStock = (req, res, next) => {
    res.locals.asset = defineCommonLocals(AssetStock, 'stock');
    next();
};

const provideAssetCrypto = (req, res, next) => {
    res.locals.asset = defineCommonLocals(AssetCrypto, 'crypto');
    next();
};

const provideAssetCash = (req, res, next) => {
    res.locals.asset = defineCommonLocals(AssetCash, 'cash');
    res.locals.asset.url = 'cash';
    next();
};

module.exports = { provideAssetStock, provideAssetCrypto, provideAssetCash };