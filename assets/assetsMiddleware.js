const AssetStock = require('../models/stock/Asset');
const AssetCrypto = require('../models/crypto/Asset');
const AssetCash = require('../models/cash/Asset');
const constants = require('../constants');

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
    res.locals.asset = defineCommonLocals(AssetStock, constants.ASSET_TYPE.STOCK);
    next();
};

const provideAssetCrypto = (req, res, next) => {
    res.locals.asset = defineCommonLocals(AssetCrypto, constants.ASSET_TYPE.CRYPTO);
    next();
};

const provideAssetCash = (req, res, next) => {
    res.locals.asset = defineCommonLocals(AssetCash, constants.ASSET_TYPE.CASH);
    res.locals.asset.url = constants.ASSET_TYPE.CASH;
    next();
};

module.exports = { provideAssetStock, provideAssetCrypto, provideAssetCash };