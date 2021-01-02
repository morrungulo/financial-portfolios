const mongoose = require('mongoose');

// intraday of name
const exchangeIntradaySchema = new mongoose.Schema({
    Open: Number,
    High: Number,
    Low: Number,
    Close: Number
}, { timestamps: true });

// daily of name
const exchangeDailySchema = new mongoose.Schema({
    Open: Number,
    High: Number,
    Low: Number,
    Close: Number
}, { timestamps: true });

// the schema
const exchangeCryptoSchema = new mongoose.Schema({

    // crypto currenty, eg. XRP, BTC, HOT
    from: {
        type: String,
        trim: true,
        uppercase: true,
        required: [true, 'Please enter a crypto-currency']
    },

    // money currency, eg. USD, EUR
    to: {
        type: String,
        trim: true,
        uppercase: true,
        required: [true, 'Please enter a currency']
    },

    exchangeIntraday: exchangeIntradaySchema,
    exchangeDaily: [exchangeDailySchema]

}, { timestamps: true});

const ExchangeCrypto = mongoose.model('exchangecrypto', exchangeCryptoSchema);

module.exports = ExchangeCrypto;