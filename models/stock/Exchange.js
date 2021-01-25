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
}, { timestamps: true });  

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
}, { timestamps: true });

// time series
const exchangeTimeSeriesSchema = new mongoose.Schema({
    LastRefreshed: { type: Date, set: convertNoneToZero },
    Open: { type: Number, set: convertNoneToZero },
    High: { type: Number, set: convertNoneToZero },
    Low: { type: Number, set: convertNoneToZero },
    Close: { type: Number, set: convertNoneToZero },
}, { timestamps: true });

// calculated items
const exchangeCalculatedSchema = new mongoose.Schema({
    DividendYieldPercent: Number,    // 100*(overview.dividend/quote.price)
    DividendPayoutRatioPercent: Number,    // 100*(1-(overview.EPS-overview.dividend)/overview.EPS)
    Week52RangePercent: Number,     // 100*((quote.price - overview.week52low) / (overview.week52high - overview.week52low))
}, { timestamps: true });

// the stock schema (aggregator)
const exchangeStockSchema = new mongoose.Schema({

    // Stock ticker, eg. AAPL, AMZN, IBM
    name: {
        type: String,
        trim: true,
        uppercase: true,
        required: [true, 'Please enter a ticker']
    },
    exchangeOverview: exchangeOverviewSchema,
    exchangeQuote: exchangeQuoteSchema,
    exchangeCalculated: exchangeCalculatedSchema,
    exchangeIntraday: [exchangeTimeSeriesSchema],
    exchangeDaily: [exchangeTimeSeriesSchema]

}, { timestamps: true});

// listeners
exchangeStockSchema.pre('save', function(next) {
    this.exchangeCalculated.DividendYieldPercent = 100 * (this.exchangeOverview.Dividend / this.exchangeQuote.Price);
    if (this.exchangeOverview.EPS != 0) {
        this.exchangeCalculated.DividendPayoutRatioPercent = 100 * (1 - (this.exchangeOverview.EPS - this.exchangeOverview.Dividend) / this.exchangeOverview.EPS);
    } else {
        this.exchangeCalculated.DividendPayoutRatioPercent = 0;
    }
    this.exchangeCalculated.Week52RangePercent = 100 * ((this.exchangeQuote.Price - this.exchangeOverview.Week52Low) / (this.exchangeOverview.Week52High - this.exchangeOverview.Week52Low));
    next();
});

// the model
const ExchangeStock = mongoose.model('exchangestock', exchangeStockSchema);

module.exports = ExchangeStock;