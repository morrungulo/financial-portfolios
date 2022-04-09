const config = require('config');
const { fetchAndParseCsvFile } = require('../../util/fetchCsv');
const rapidapi = require('../api/rapidapi');

/**
 * Convert alpha data into mongodb schema data
 * @param {json} alpha 
 * @returns mongodb schema data
 */
const buildFromAlphaRate = (alpha) => {
    const entry = alpha['Realtime Currency Exchange Rate'];
    return {
        FromCode: entry['1. From_Currency Code'],
        FromName: entry['2. From_Currency Name'],
        ToCode: entry['3. To_Currency Code'],
        ToName: entry['4. To_Currency Name'],
        Rate: entry['5. Exchange Rate'],
        LastRefreshed: entry['6. Last Refreshed'],
        TimeZone: entry['7. Time Zone'],
        BidPrice: entry['8. Bid Price'],
        AskPrice: entry['9. Ask Price'],
    };
}

/**
 * Convert alpha data into mongodb schema data
 * @param {json} alpha 
 * @returns mongodb schema data
 */
const buildFromAlphaTimeSeries = (alpha) => {
    let timeSeries = [];
    for (var k1 in alpha) {
        if (k1.startsWith('Time Series')) {
            for (var k2 in alpha[k1]) {
                const entry = alpha[k1][k2];
                const data = {
                    LastRefreshed: k2,
                    Open: 0,
                    High: 0,
                    Low: 0,
                    Close: 0,
                    Volume: 0,
                };
                for (var k3 in entry) {
                    if (k3.startsWith('1a.')) {
                        data.Open = entry[k3];
                    } else if (k3.startsWith('2a.')) {
                        data.High = entry[k3];
                    } else if (k3.startsWith('3a.')) {
                        data.Low = entry[k3];
                    } else if (k3.startsWith('4a.')) {
                        data.Close = entry[k3];
                    } else if (k3.startsWith('5.')) {
                        data.Volume = entry[k3];
                    }
                }
                timeSeries.push(data);
            }
        }
    }
    return timeSeries;
}

async function fetchExchangeRate(from, to) {
    const response = await rapidapi.currencyExchangeRate(from, to);
    const result = buildFromAlphaRate(response.data);
    return result;
}

async function fetchExchangeDaily(from, to) {
    const response = await rapidapi.cryptoDaily(from, to);
    const result = buildFromAlphaTimeSeries(response.data);
    return result;
}

function fetchExchangeCalculated() {
    return new Promise((res, rej) => {
        const result = {
            Change: 0,
            ChangePercent: 0,
        };
        res(result);
    });
}

async function fetchAll(from, to) {
    const result = await Promise.all([
        fetchExchangeRate(from, to),
        fetchExchangeDaily(from, to),
        fetchExchangeCalculated(),
    ]);
    return result;
}

async function fetchValidListing() {
    const url = 'https://www.alphavantage.co/digital_currency_list/';
    const result = await fetchAndParseCsvFile(url);
    return result;
}

module.exports = {
    fetchAll,
    fetchExchangeRate,
    fetchExchangeDaily,
    fetchExchangeCalculated,
    fetchValidListing,
}