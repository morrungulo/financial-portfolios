const mongoose = require('mongoose');
const { convertNoneToZero } = require('../utils');

// error messages
const errorMessages = {
    missingFrom: "Please enter the digital currency code for the 'from' currency (e.g. BTC)",
    missingTo: "Please enter the 3-letter currency code for the 'to' currency (e.g. EUR)",
    missingName: "Please enter a name",
    missingLongname: "Please enter a long name",
    missingQuote: "Please enter the quote",
    missingRate: "Please enter the rate",
}

// exchange rate
const exchangeRateSchema = new mongoose.Schema({
    Rate: { type: Number, set: convertNoneToZero },
    BidPrice: { type: Number, set: convertNoneToZero },
    AskPrice: { type: Number, set: convertNoneToZero },
});

// time series
const exchangeTimeSeriesSchema = new mongoose.Schema({
    LastRefreshed: { type: Date, set: convertNoneToZero },
    Open: { type: Number, set: convertNoneToZero },
    High: { type: Number, set: convertNoneToZero },
    Low: { type: Number, set: convertNoneToZero },
    Close: { type: Number, set: convertNoneToZero },
    Volume: { type: Number, set: convertNoneToZero },
});

// x,y coords for charts
const exchangeXYcoordSchema = new mongoose.Schema({
    x: Date,
    y: Number,
});

// aggregator of all x,y coords for charts
const exchangeXYDailySchema = new mongoose.Schema({
    W1: [exchangeXYcoordSchema],
    M1: [exchangeXYcoordSchema],
    M3: [exchangeXYcoordSchema],
    M6: [exchangeXYcoordSchema],
    Y1: [exchangeXYcoordSchema],
    Y5: [exchangeXYcoordSchema],
});

// calculated items
const exchangeCalculatedSchema = new mongoose.Schema({
    Change: { type: Number, default: 0 },         // exchangeDaily[0].Rate - exchangeDaily[1].Rate
    ChangePercent: { type: Number, default: 0 },  // Change/exchangeDaily[0].Rate
});

// the schema
const exchangeCryptoSchema = new mongoose.Schema({

    // digital code (e.g. BTC)
    from: {
        type: String,
        trim: true,
        uppercase: true,
        required: [true, errorMessages.missingFrom],
        index: true,
    },

    // 3-letter code (e.g. EUR)
    to: {
        type: String,
        trim: true,
        minlength: [3, errorMessages.missingTo],
        maxlength: [3, errorMessages.missingTo],
        uppercase: true,
        required: [true, errorMessages.missingTo],
        index: true,
    },

    name: {
        type: String,
        trim: true,
        uppercase: true,
        required: [true, errorMessages.missingName],
    },

    longName: {
        type: String,
        trim: true,
        required: [true, errorMessages.missingLongname],
    },

    exchangeQuote: {
        type: exchangeTimeSeriesSchema,
        required: [true, errorMessages.missingQuote],
    },

    exchangeCalculated: exchangeCalculatedSchema,

    exchangeRate: {
        type: exchangeRateSchema,
        required: [true, errorMessages.missingRate]
    },

    exchangeDaily: [exchangeTimeSeriesSchema],
    exchangeGraphData: exchangeXYDailySchema,

}, { timestamps: true });

// the model
const ExchangeCrypto = mongoose.model('exchangecrypto', exchangeCryptoSchema);

module.exports = ExchangeCrypto;