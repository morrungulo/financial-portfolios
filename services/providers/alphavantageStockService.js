const { default: chalk } = require('chalk');
const config = require('config');
const { fetchAndParseCsvFile, parseCsvData } = require('../../util/fetchCsv');
const rapidapi = require('../api/rapidapiAlphaVantage');

/**
 * Convert alpha data into mongodb schema data
 * @param {json} alpha 
 * @returns mongodb schema data
 */
const buildFromAlphaOverview = (alpha) => {
    return {
        Name: alpha.Name,
        Description: alpha.Description,
        Exchange: alpha.Exchange,
        Currency: alpha.Currency,
        Sector: alpha.Sector,
        Industry: alpha.Industry,
        PERatio: alpha.PERatio,
        PEGRatio: alpha.PEGRatio,
        ForwardPE: alpha.ForwardPE,
        ProfitMargin: alpha.ProfitMargin,
        Dividend: alpha.DividendPerShare,
        DividendDate: alpha.DividendDate,
        ExDividendDate: alpha.ExDividendDate,
        EPS: alpha['EPS'],
        Week52High: alpha['52WeekHigh'],
        Week52Low: alpha['52WeekLow'],
        TargetPrice: alpha.AnalystTargetPrice,
        SharesOutstanding: alpha.SharesOutstanding,
        BookValue: alpha.BookValue,
        PriceToSalesRatioTTM: alpha.PriceToSalesRatioTTM,
        PriceToBookRatio: alpha.PriceToBookRatio,
        MarketCapitalization: alpha.MarketCapitalization,
        EBITDA: alpha['EBITDA'],
    };
}

/**
 * Convert alpha data into mongodb schema data
 * @param {json} alpha 
 * @returns mongodb schema data
 */
const buildFromAlphaQuote = (alpha) => {
    const quote = alpha['Global Quote'];
    return {
        Open: quote['02. open'],
        High: quote['03. high'],
        Low: quote['04. low'],
        Price: quote['05. price'],
        Volume: quote['06. volume'],
        LastTradingDay: quote['07. latest trading day'],
        PreviousClose: quote['08. previous close'],
        Change: quote['09. change'],
        ChangePercent: quote['10. change percent'],
    };
}

/**
 * Convert alpha data into mongodb schema data
 * @param {json} alpha 
 * @returns mongodb schema data
 */
const buildFromAlphaTimeSeries = (alpha) => {
    let exData = [];
    for (var k1 in alpha) {
        if (k1.startsWith('Time Series')) {
            const adjustedCoefficient = 1;
            for (var k2 in alpha[k1]) {
                const daily = alpha[k1][k2];
                const exEntry = {
                    LastRefreshed: k2,
                    Open: daily['1. open'],
                    High: daily['2. high'],
                    Low: daily['3. low'],
                    Close: daily['4. close'],
                    AdjustedClose: daily['5. adjusted close'],
                    Volume: daily['6. volume'],
                };
                exData.push(exEntry);
            }
        }
    }
    return exData;
}

async function fetchExchangeOverview(ticker) {
    const response = await rapidapi.stockOverview(ticker);
    const result = buildFromAlphaOverview(response.data);
    return result;
}

// async function fetchExchangeIntraday(ticker) {
//     const data = await alpha.data.intraday(ticker, 'full', 'json', '5min');
//     const result = buildFromAlphaTimeSeries(data);
//     return result;
// }

async function fetchExchangeQuote(ticker) {
    const response = await rapidapi.stockQuote(ticker);
    const result = buildFromAlphaQuote(response.data);
    return result;
}

async function fetchExchangeDaily(ticker) {
    const response = await rapidapi.stockDailyAdjusted(ticker);
    const result = buildFromAlphaTimeSeries(response.data);
    return result;
}

function fetchExchangeCalculated() {
    return new Promise((res, rej) => {
        const result = {
            DividendYieldPercent: 0,
            DividendPayoutRatioPercent: 0,
            Week52RangePercent: 0,
        };
        res(result);
    });
}

async function fetchAll(ticker) {
    const result = await Promise.all([
        fetchExchangeOverview(ticker),
        fetchExchangeQuote(ticker),
        fetchExchangeDaily(ticker),
        fetchExchangeCalculated(),
    ]);
    return result;
}

async function fetchValidListing() {
    const response = await rapidapi.stockListingStatus();
    const result = await parseCsvData(response.data);
    return result;
}

module.exports = {
    fetchAll,
    fetchExchangeOverview,
    fetchExchangeQuote,
    fetchExchangeDaily,
    fetchExchangeCalculated,
    fetchValidListing,
}