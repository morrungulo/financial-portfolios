const mongoose = require('mongoose');
const transactionCryptoSchema = require('./Transaction');

// the schema
const assetCryptoSchema = new mongoose.Schema({
    kind: {
        type: String,
        default: 'Crypto',
        immutable: true
    },

    currency: {
        type: String,
        trim: true,
        uppercase: true,
        required: [true, "Please enter a currency"]
    },

    // buy, sell, etc.
    transactions: [transactionCryptoSchema],

    total_quantity: {
        type: Number,
        min: 0,
        default: 0
    },
    total_cost: {
        type: Number,
        min: 0,
        default: 0
    },
    unrealized_value: {
        type: Number,
        min: 0,
        default: 0,
    },
    unrealized_value_percentage: {
        type: Number,
        min: 0,
        default: 0
    },
    realized_value: {
        type: Number,
        min: 0,
        default: 0,
    },
    total_commissions: {
        type: Number,
        min: 0,
        default: 0,
    },
    daily_value: {
        type: Number,
        min: 0,
        default: 0
    },
    daily_value_percentage: {
        type: Number,
        min: 0,
        default: 0
    },

    // calculated
    change_value: {
        type: Number,
        min: 0,
        default: 0
    },
    change_value_percentage: {
        type: Number,
        min: 0,
        default: 0
    },

    // exchange data
    exchange_id: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'ExchangeCrypto',
        required: true
    }
});

// there is no model

module.exports = assetCryptoSchema;