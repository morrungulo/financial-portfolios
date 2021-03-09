const mongoose = require('mongoose');
const { convertNoneToZero, convertStringWithPercentSignToNumber } = require('../utils');

// overview 
const exchangeOverviewSchema = new mongoose.Schema({
    Name: String,
    Description: String,
    Exchange: String,
    Currency: String,
    Sector: String,
    Industry: String,
    PERatio: { type: Number, set: convertNoneToZero },
    PEGRatio: { type: Number, set: convertNoneToZero },
    ForwardPE: { type: Number, set: convertNoneToZero },
    ProfitMargin: { type: Number, set: convertNoneToZero },
    Dividend: { type: Number, set: convertNoneToZero },
    DividendDate: { type: Date, set: convertNoneToZero },
    ExDividendDate: { type: Date, set: convertNoneToZero },
    EPS: { type: Number, set: convertNoneToZero },
    Week52High: { type: Number, set: convertNoneToZero },
    Week52Low: { type: Number, set: convertNoneToZero },
    TargetPrice: { type: Number, set: convertNoneToZero },
    SharesOutstanding: { type: Number, set: convertNoneToZero },
    BookValue: { type: Number, set: convertNoneToZero },
    PriceToSalesRatioTTM: { type: Number, set: convertNoneToZero },
    PriceToBookRatio: { type: Number, set: convertNoneToZero },
    MarketCapitalization: { type: Number, set: convertNoneToZero },
    EBITDA: { type: Number, set: convertNoneToZero },
});  

// quote
const exchangeQuoteSchema = new mongoose.Schema({
    Open: { type: Number, set: convertNoneToZero },
    High: { type: Number, set: convertNoneToZero },
    Low: { type: Number, set: convertNoneToZero },
    Price: { type: Number, set: convertNoneToZero },
    Volume: { type: Number, set: convertNoneToZero },
    LastTradingDay: { type: Date, set: convertNoneToZero },
    PreviousClose: { type: Number, set: convertNoneToZero },
    Change: { type: Number, set: convertNoneToZero },
    ChangePercent: { type: Number, set: convertStringWithPercentSignToNumber },
});

// time series
const exchangeTimeSeriesSchema = new mongoose.Schema({
    LastRefreshed: { type: Date, set: convertNoneToZero },
    Open: { type: Number, set: convertNoneToZero },
    High: { type: Number, set: convertNoneToZero },
    Low: { type: Number, set: convertNoneToZero },
    Close: { type: Number, set: convertNoneToZero },
    AdjustedClose: { type: Number, set: convertNoneToZero },
    Volume: { type: Number, set: convertNoneToZero },
});

// calculated items
const exchangeCalculatedSchema = new mongoose.Schema({
    DividendYieldPercent: Number,    // 100*(overview.dividend/quote.price)
    DividendPayoutRatioPercent: Number,    // 100*(1-(overview.EPS-overview.dividend)/overview.EPS)
    Week52RangePercent: Number,     // 100*((quote.price - overview.week52low) / (overview.week52high - overview.week52low))
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

// the stock schema (aggregator)
const exchangeStockSchema = new mongoose.Schema({

    // Stock ticker, eg. AAPL, AMZN, IBM
    name: {
        type: String,
        trim: true,
        uppercase: true,
        required: [true, 'Please enter a ticker'],
        index: true,
    },
    
    exchangeOverview: exchangeOverviewSchema,
    exchangeQuote: exchangeQuoteSchema,
    exchangeCalculated: exchangeCalculatedSchema,
    
    exchangeDaily: [exchangeTimeSeriesSchema],
    exchangeGraphData: exchangeXYDailySchema,

}, { timestamps: true});

// the model
const ExchangeStock = mongoose.model('exchangestock', exchangeStockSchema);

module.exports = ExchangeStock;