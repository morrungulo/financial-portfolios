const mongoose = require('mongoose');
const transactionSchema = require('./Transaction');

// data retrieved from exchange
const exchangeOverviewSchema = new mongoose.Schema({
    Name: String,
    Description: String,
    Exchange: String,
    Currency: String,
    Sector: String,
    Industry: String,
    PEratio: Number,
    Dividend: Number,
    DividendDate: Date,
    ExDividendDate: Date,
    EPS: Number,
    Week52High: Number,
    Week52Low: Number
});

const exchangeIntradaySchema = new mongoose.Schema({
    LastRefreshed: String,
    TimeZone: String,
    Open: Number,
    High: Number,
    Low: Number,
    Close: Number
});

const exchangeDailySchema = new mongoose.Schema({
    LastRefreshed: String,
    TimeZone: String,
    Open: Number,
    High: Number,
    Low: Number,
    Close: Number
});

// the schema
const assetSchema = new mongoose.Schema({
    kind: {
        type: String,
        trim: true,
        required: true,
        enum: ['Stock', 'Crypto', 'Cash']
    },
    ticker: {
        type: String,
        trim: true,
        required: true,
        uppercase: true
    },
    transactions: [transactionSchema],
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
    unrealized_value_percentage: {
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
    change_value: Number,
    change_value_percentage: Number,

    // exchange data
    exchangeOverview: exchangeOverviewSchema,
    exchangeIntraday: exchangeIntradaySchema,
    exchangeDaily: [exchangeDailySchema]
});

// there is no model

module.exports = assetSchema;