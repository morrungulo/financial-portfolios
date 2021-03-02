const mongoose = require('mongoose');
const { convertNoneToZero } = require('../utils');

// error messages
const errorMessages = {
    from: "'From' must be a 3-letter currency code (e.g. EUR)",
    to: "'To' must be a 3-letter currency code (e.g. EUR)"
}

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

// the schema
const exchangeForexSchema = new mongoose.Schema({
    
    // 3-letter code (e.g. EUR)
    from: {
        type: String,
        trim: true,
        minlength: [3, errorMessages.from],
        maxlength: [3, errorMessages.from],
        uppercase: true,
        required: [true, "Please enter a 'from' currency"],
        index: true,
    },

    // 3-letter code (e.g. EUR)
    to: {
        type: String,
        trim: true,
        minlength: [3, errorMessages.to],
        maxlength: [3, errorMessages.to],
        uppercase: true,
        required: [true, "Please enter a 'to' currency"],
        index: true,
    },

    rate: {
        type: Number,
        required: [true, "Please enter a 'conversion rate' for this currency"]
    },

    exchangeDaily: [exchangeTimeSeriesSchema],

    exchangeGraphData: exchangeXYDailySchema,

}, { timestamps: true});

// the model
const ExchangeForex = mongoose.model('exchangeforex', exchangeForexSchema);

module.exports = ExchangeForex;