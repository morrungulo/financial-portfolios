const config = require('config');
const alpha = require('alphavantage')({ key: config.get('alphavantage.apikey') });

/**
 * Convert alpha data into mongodb schema data
 * @param {json} alpha 
 * @returns mongodb schema data
 */
const buildExchangeOverviewFromAlpha = (alpha) => {
    return {
        Name: alpha.Name,
        Description: alpha.Description,
        Exchange: alpha.Exchange,
        Currency: alpha.Currency,
        Sector: alpha.Sector,
        Industry: alpha.Industry,
        PEratio: alpha.PEratio,
        Dividend: alpha.DividendPerShare,
        DividendDate: alpha.DividendDate,
        ExDividendDate: alpha.ExDividendDate,
        EPS: alpha['EPS'],
        Week52High: alpha['52WeekHigh'],
        Week52Low: alpha['52WeekLow'],
    };
}

/**
 * Convert alpha data into mongodb schema data
 * @param {json} alpha 
 * @returns mongodb schema data
 */
const buildExchangeIntradayFromAlpha = (alpha) => {
    for (var k1 in alpha) {
        if (k1.startsWith('Time Series')) {
            for (var k2 in alpha[k1]) {
                const intraday = alpha[k1][k2];
                return {
                    LastRefreshed: k2,
                    Open: intraday['1. open'],
                    High: intraday['2. high'],
                    Low: intraday['3. low'],
                    Close: intraday['4. close'],
                }
            }
        }
    }
}

/**
 * Convert alpha data into mongodb schema data
 * @param {json} alpha 
 * @returns mongodb schema data
 */
const buildExchangeDailyFromAlpha = (alpha) => {
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
    return buildExchangeOverviewFromAlpha(data);
}

async function fetchExchangeIntraday(ticker) {
    const data = await alpha.data.intraday(ticker);
    return buildExchangeIntradayFromAlpha(data);
}

async function fetchExchangeDaily(ticker) {
    const data = await alpha.data.daily_adjusted(ticker);
    return buildExchangeDailyFromAlpha(data);
}

async function fetchAll(ticker) {
    return Promise.all([
        fetchExchangeOverview(ticker),
        fetchExchangeIntraday(ticker),
        fetchExchangeDaily(ticker)
    ]);    
}

module.exports = {
    fetchAll,
    fetchExchangeOverview,
    fetchExchangeIntraday,
    fetchExchangeDaily
}