const mongoose = require('mongoose');
const { convertNoneToZero } = require('../utils');

// error messages
const errorMessages = {
    from: "'From' must be a digital currency code (e.g. BTC)",
    to: "'To' must be a 3-letter currency code (e.g. EUR)"
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
    o: Number,
    h: Number,
    l: Number,
    c: Number,
    v: Number,
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
const exchangeCryptoSchema = new mongoose.Schema({
    
    // digital code (e.g. BTC)
    from: {
        type: String,
        trim: true,
        uppercase: true,
        required: [true, "Please enter a 'from' digital currency"],
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

    shortName: {
        type: String,
        trim: true,
        uppercase: true,
        required: [true, "Please enter a short name"],
    },

    longName: {
        type: String,
        trim: true,
        required: [true, "Please enter a long name"],
    },

    exchangeQuote: {
        type: exchangeTimeSeriesSchema,
        required: [true, "Please enter a quote"],
    },

    exchangeCalculated: exchangeCalculatedSchema,

    exchangeRate: {
        type: exchangeRateSchema,
        required: [true, "Please enter a rate"]
    },

    exchangeDaily: [exchangeTimeSeriesSchema],
    exchangeGraphData: exchangeXYDailySchema,

}, { timestamps: true});

// listeners
exchangeCryptoSchema.pre('save', function(next) {
    if (this.exchangeDaily.length >= 2) {
        this.exchangeCalculated.Change = this.exchangeDaily[0].Close - this.exchangeDaily[1].Close;
        this.exchangeCalculated.ChangePercent = (this.exchangeCalculated.Change / this.exchangeDaily[1].Close) * 100;
    }
    next();
});

// the model
const ExchangeCrypto = mongoose.model('exchangecrypto', exchangeCryptoSchema);

module.exports = ExchangeCrypto;