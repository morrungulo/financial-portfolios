const mongoose = require('mongoose');

// time series of name
const exchangeTimeSeriesSchema = new mongoose.Schema({
    LastRefreshed: Date,
    Open: Number,
    High: Number,
    Low: Number,
    Close: Number,
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

    exchangeIntraday: [exchangeTimeSeriesSchema],
    exchangeDaily: [exchangeTimeSeriesSchema]

}, { timestamps: true});

const ExchangeCrypto = mongoose.model('exchangecrypto', exchangeCryptoSchema);

module.exports = ExchangeCrypto;