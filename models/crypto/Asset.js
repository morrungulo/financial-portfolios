const mongoose = require('mongoose');
const ExchangeCrypto= require('./Exchange');
const Portfolio = require('../../models/Portfolio');
const commonAssetSchema = require('../common/assetSchema');

// the schema
const assetCryptoSchema = new mongoose.Schema({  

    kind: {
        type: String,
        default: 'Crypto',
        immutable: true
    },
    
    common: {
        type: commonAssetSchema.commonSchema,
        default: {},
    },

    // portfolio data
    portfolio_id: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'portfolio',
        required: true,
        index: true,
    },

    // exchange data
    exchange_id: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'exchangecrypto',
        required: true
    }

}, { toJSON: { virtuals: true }, toObject: { virtuals: true }, timestamps: true });

// virtuals (child to parent referencing)
assetCryptoSchema.virtual('transactions', {
    ref: 'transactioncrypto',
    foreignField: 'asset_id',
    localField: '_id',
});

assetCryptoSchema.virtual('isOpen').get(function() {
    return commonAssetSchema.isOpen(this.common);
});

assetCryptoSchema.virtual('isError').get(function() {
    return commonAssetSchema.isError(this.common);
});

assetCryptoSchema.virtual('displayName').get(function() {
    return this.exchange_id.shortName;
});

// the model
const AssetCrypto = mongoose.model('assetcrypto', assetCryptoSchema);

module.exports = AssetCrypto;