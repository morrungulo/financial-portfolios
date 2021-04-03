const mongoose = require('mongoose');
const ExchangeForex = require('./Exchange');
const Portfolio = require('../../models/Portfolio');
const commonAssetSchema = require('../common/assetSchema');

// the schema
const assetCashSchema = new mongoose.Schema({

    kind: {
        type: String,
        default: 'Cash',
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
        ref: 'exchangeforex',
        required: true
    }

}, { toJSON: { virtuals: true }, toObject: { virtuals: true }, timestamps: true });

// virtuals (child to parent referencing)
assetCashSchema.virtual('transactions', {
    ref: 'transactioncash',
    foreignField: 'asset_id',
    localField: '_id',
});

assetCashSchema.virtual('isOpen').get(function () {
    return commonAssetSchema.isOpen(this.common);
});

assetCashSchema.virtual('isError').get(function () {
    return commonAssetSchema.isError(this.common);
});

assetCashSchema.virtual('displayName').get(function () {
    return this.exchange_id.shortName;
});

// the model
const AssetCash = mongoose.model('assetcash', assetCashSchema);

module.exports = AssetCash;