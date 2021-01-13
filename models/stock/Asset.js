const mongoose = require('mongoose');

// the schema
const assetStockSchema = new mongoose.Schema({
    kind: {
        type: String,
        default: 'Stock',
        immutable: true
    },

    // buy, sell, etc.
    transactions: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'transactionstock'
    }],
    
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

    // tags (categories)
    tags: [{
        type: String,
        trim: true,
        lowercase: true,
    }],

    // notes
    notes: {
        type: Buffer
    },

    // portfolio data
    portfolio_id: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'portfolio',
        required: true
    },

    // exchange data
    exchange_id: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'exchangestock',
        required: true
    }
});

// the model
const AssetStock = mongoose.model('assetstock', assetStockSchema);

module.exports = AssetStock;