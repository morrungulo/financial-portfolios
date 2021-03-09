const mongoose = require('mongoose');
const { convertNoneToZero } = require('../utils');

// error messages
const errorMessages = {
    message: "The currency must be a 3-letter currency code (e.g. EUR)",
    missingFrom: "Please enter the 3-letter currency code for the 'from' currency",
    missingTo: "Please enter the 3-letter currency code for the 'to' currency",
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
});

// x,y coords for charts
const exchangeXYcoordSchema = new mongoose.Schema({
    x: Date,
    y: Number,
    o: Number,
    h: Number,
    l: Number,
    c: Number,
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
    Change: Number,    // exchangeDaily[0].Rate - exchangeDaily[1].Rate
    ChangePercent: Number,    // Change/exchangeDaily[0].Rate
});

// the schema
const exchangeForexSchema = new mongoose.Schema({
    
    // 3-letter code (e.g. EUR)
    from: {
        type: String,
        trim: true,
        minlength: [3, errorMessages.message],
        maxlength: [3, errorMessages.message],
        uppercase: true,
        required: [true, errorMessages.missingFrom],
        index: true,
    },

    // 3-letter code (e.g. EUR)
    to: {
        type: String,
        trim: true,
        minlength: [3, errorMessages.message],
        maxlength: [3, errorMessages.message],
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
        required: [true, errorMessages.missingRate],
    },

    exchangeDaily: [exchangeTimeSeriesSchema],
    exchangeGraphData: exchangeXYDailySchema,

}, { timestamps: true});

// the model
const ExchangeForex = mongoose.model('exchangeforex', exchangeForexSchema);

module.exports = ExchangeForex;