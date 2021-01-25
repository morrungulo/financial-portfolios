const mongoose = require('mongoose');
// const ExchangeStock = require('./Exchange');
// const TransactionStock = require('./Transaction');

// the schema
const assetStockSchema = new mongoose.Schema({
    kind: {
        type: String,
        default: 'Stock',
        immutable: true
    },
    
    total_quantity: {
        type: Number,
        default: 0
    },
    total_cost: {
        type: Number,
        min: 0,
        default: 0
    },

    // price*total_quantity
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

    // sum(sell transactions + total_dividends)
    realized_value: {
        type: Number,
        min: 0,
        default: 0,
    },

    // sum(dividend transactions)
    total_dividends: {
        type: Number,
        min: 0,
        default: 0,
    },

    // sum(buy.commission + sell.commission)
    total_commissions: {
        type: Number,
        min: 0,
        default: 0,
    },

    // change*total_quantity
    daily_value: {
        type: Number,
        default: 0
    },
    daily_value_percentage: {
        type: Number,
        default: 0
    },

    // are these needed?
    change_value: {
        type: Number,
        default: 0
    },
    change_value_percentage: {
        type: Number,
        default: 0
    },

    // tags (categories)
    tags: [{
        type: String,
        trim: true,
        lowercase: true,
    }],

    total_transactions: {
        type: Number,
        min: 0,
        default: 0
    },

    // notes
    notes: {
        type: String,
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

}, { toJSON: { virtuals: true }, toObject: { virtuals: true }, timestamps: true });

// virtuals (child to parent referencing)
assetStockSchema.virtual('transactions', {
    ref: 'transactionstock',
    foreignField: 'asset_id',
    localField: '_id',
});

// the model
const AssetStock = mongoose.model('assetstock', assetStockSchema);

module.exports = AssetStock;