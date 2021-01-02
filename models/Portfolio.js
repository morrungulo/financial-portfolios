const mongoose = require('mongoose');
const assetCashSchema = require('./cash/Asset');
const assetCryptoSchema = require('./crypto/Asset');
const assetStockSchema = require('./stock/Asset');
const { twoDecimalPoints } = require('./utils.js');

// the schema
const portfolioSchema = new mongoose.Schema({

    // portfolio name
    name: {
        type: String,
        trim: true,
        required: [true, 'Please enter a portfolio name']
    },

    // who owns it
    user_id: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },

    // the currency of this portfolio - all values of different currencies shall be converted to this one
    currency: {
        type: String,
        trim: true,
        uppercase: true,
        required: [true, 'Please enter a portfolio currency']
    },

    // the list of cash assets
    cash_assets: [assetCashSchema],

    // the list of crypto assets
    crypto_assets: [assetCryptoSchema],

    // the list of stock assets
    stock_assets: [assetStockSchema],

    // calculated value
    unrealized_value: {
        type: Number,
        get: twoDecimalPoints,
        default: 0
    },
    unrealized_value_percentage: {
        type: Number,
        get: twoDecimalPoints,
        default: 0
    },

    // sum(asset.dividend + asset.realized)
    realized_value: {
        type: Number,
        get: twoDecimalPoints,
        default: 0
    },

    // sum(asset.cost)
    cost_basis: {
        type: Number,
        get: twoDecimalPoints,
        default: 0
    },

    // unrealized_value - cost-basis
    total_value: {
        type: Number,
        get: twoDecimalPoints,
        default: 0
    },

    // ((unrealized_value / cost_basis) - 1) * 100
    total_value_percentage: {
        type: Number,
        get: twoDecimalPoints,
        default: 0
    },
    
    annualized_value: {
        type: Number,
        get: twoDecimalPoints,
        default: 0
    },
    
    daily_value: {
        type: Number,
        get: twoDecimalPoints,
        default: 0
    },
    daily_value_percentage: {
        type: Number,
        get: twoDecimalPoints,
        default: 0
    },
});

const Portfolio = mongoose.model('portfolio', portfolioSchema);

module.exports = Portfolio;