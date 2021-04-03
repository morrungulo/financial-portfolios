const mongoose = require('mongoose');
const ExchangeStock = require('./Exchange');
const Portfolio = require('../../models/Portfolio');
const commonAssetSchema = require('../common/assetSchema');

// the schema
const assetStockSchema = new mongoose.Schema({

    kind: {
        type: String,
        default: 'Stock',
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
        ref: 'exchangestock',
        required: true
    }

}, { toJSON: { virtuals: true }, toObject: { virtuals: true }, timestamps: true });

// virtuals (child to parent referencing)
assetStockSchema.virtual('transactions', {
    ref: 'transactionstock',
    foreignField: 'asset_id',
    localField: '_id',
});

assetStockSchema.virtual('isOpen').get(function () {
    return commonAssetSchema.isOpen(this.common);
});

assetStockSchema.virtual('isError').get(function () {
    return commonAssetSchema.isError(this.common);
});

assetStockSchema.virtual('displayName').get(function () {
    return this.exchange_id.name;
});

// the model
const AssetStock = mongoose.model('assetstock', assetStockSchema);

module.exports = AssetStock;