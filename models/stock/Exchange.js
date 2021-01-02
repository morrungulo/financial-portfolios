const mongoose = require('mongoose');
const chalk = require('chalk');

function convertNoneToZero(v) {
    return (typeof(v) === 'string' && v == 'None') ? 0 : v;
}

// overview of name
const exchangeOverviewSchema = new mongoose.Schema({
    Name: String,
    Description: String,
    Exchange: String,
    Currency: String,
    Sector: String,
    Industry: String,
    PEratio: Number,
    Dividend: {
        type: Number,
        set: convertNoneToZero
    },
    DividendDate: {
        type: Date,
        set: convertNoneToZero
    },
    ExDividendDate: {
        type: Date,
        set: convertNoneToZero
    },
    EPS: Number,
    Week52High: Number,
    Week52Low: Number
}, { timestamps: true });  

// intraday of name
const exchangeIntradaySchema = new mongoose.Schema({
    LastRefreshed: Date,
    Open: Number,
    High: Number,
    Low: Number,
    Close: Number
}, { timestamps: true });

// daily of name
const exchangeDailySchema = new mongoose.Schema({
    LastRefreshed: Date,
    Open: Number,
    High: Number,
    Low: Number,
    Close: Number
}, { timestamps: true });

// the schema
const exchangeStockSchema = new mongoose.Schema({

    // Stock ticker, eg. AAPL, AMZN, IBM
    name: {
        type: String,
        trim: true,
        uppercase: true,
        required: [true, 'Please enter a ticker']
    },

    exchangeOverview: {
        type: exchangeOverviewSchema,
        default: {}
    },
    // how often to refresh 'exchangeOverview' (in msec)
    exchangeOverviewRefreshRate: {
        type: Number,
        default: Number(15 * 24 * 60 * 60 * 1000)   // 15d
    },

    exchangeIntraday: {
        type: exchangeIntradaySchema,
        default: {}
    },
    // how often to refresh 'exchangeIntraday' (in msec)
    exchangeIntradayRefreshRate: {
        type: Number,
        default: Number(20 * 60 * 1000)   // 20min
    },
        
    exchangeDaily: [exchangeDailySchema],
    // how often to refresh 'exchangeDaily' (in msec)
    exchangeDailyRefreshRate: {
        type: Number,
        default: Number(12 * 60 * 60 * 1000)   // 12h
    },
    
}, { timestamps: true});

const ExchangeStock = mongoose.model('exchangestock', exchangeStockSchema);

module.exports = ExchangeStock;