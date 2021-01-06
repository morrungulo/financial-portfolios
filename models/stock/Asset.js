const mongoose = require('mongoose');
const transactionStockSchema = require('./Transaction');

// the schema
const assetStockSchema = new mongoose.Schema({
    kind: {
        type: String,
        default: 'Stock',
        immutable: true
    },

    ticker: {
        type: String,
        trim: true,
        uppercase: true,
        required: [true, "Please enter a ticker"]
    },

    // buy, sell, etc.
    transactions: [transactionStockSchema],
    
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
    total_dividends: {
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
        ref: 'ExchangeStock',
        required: true
    }
});

// there is no model

module.exports = assetStockSchema;