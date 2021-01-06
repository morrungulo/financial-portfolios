const chalk = require('chalk');
const config = require('config');
const alpha = require('alphavantage')({ key: config.get('alphavantage.apikey') });

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
            for (var k2 in alpha[k1]) {
                const daily = alpha[k1][k2];
                const exEntry = {
                    LastRefreshed: k2,
                    Open: daily['1. open'],
                    High: daily['2. high'],
                    Low: daily['3. low'],
                    Close: daily['4. close'],
                };
                exData.push(exEntry);
            }
        }
    }
    return exData;
}

async function fetchExchangeOverview(ticker) {
    const data = await alpha.fundamental.company_overview(ticker);
    console.log(chalk.yellow(JSON.stringify(data, null, "  ")));
    const result = buildFromAlphaOverview(data);
    console.log(chalk.green(JSON.stringify(result, null, "  ")));
    return result;
}

async function fetchExchangeIntraday(ticker) {
    const data = await alpha.data.intraday(ticker);
    console.log(chalk.yellow(JSON.stringify(data, null, "  ")));
    const result = buildFromAlphaTimeSeries(data);
    console.log(chalk.green(JSON.stringify(result, null, "  ")));
    return result;
}

async function fetchExchangeQuote(ticker) {
    const data = await alpha.data.quote(ticker);
    console.log(chalk.yellow(JSON.stringify(data, null, "  ")));
    const result = buildFromAlphaQuote(data);
    console.log(chalk.green(JSON.stringify(result, null, "  ")));
    return result;
}

async function fetchExchangeDaily(ticker) {
    const data = await alpha.data.daily_adjusted(ticker);
    console.log(chalk.yellow(JSON.stringify(data, null, "  ")));
    const result = buildFromAlphaTimeSeries(data);
    console.log(chalk.green(JSON.stringify(result, null, "  ")));
    return result;
}

async function fetchAll(ticker) {
    const result = await Promise.all([
        fetchExchangeOverview(ticker),
        fetchExchangeQuote(ticker),
        // fetchExchangeIntraday(ticker),
        // fetchExchangeDaily(ticker)
    ]);    
    console.trace(chalk.red(JSON.stringify(result, null, "  ")));
    return result;
}

async function isTickerValid(ticker) {
    try {
        const data = await alpha.data.quote(ticker);
        return (Object.keys(data['Global Quote']).length > 0);
    } catch (err) {
        console.error(`Could not guarantee validity of '${ticker}`);
        return false;
    }
}

module.exports = {
    fetchAll,
    fetchExchangeOverview,
    fetchExchangeQuote,
    fetchExchangeIntraday,
    fetchExchangeDaily,
    isTickerValid,
}