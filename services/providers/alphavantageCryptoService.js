const transport = require('../api/coingecko');
const chalk = require('chalk')

/**
 * Convert alpha data into mongodb schema data
 * @param {json} alpha 
 * @returns mongodb schema data
 */
const buildFromAlphaRate = (from, to, data) => {
    const rate = data[from][to]
    const result = {
        Rate: rate,
        BidPrice: rate,
        AskPrice: rate
    }
    return result;
}

/**
 * Convert alpha data into mongodb schema data
 * @param {json} alpha 
 * @returns mongodb schema data
 */
const buildFromAlphaTimeSeries = (alpha) => {
    return alpha.sort((a, b) => b[0] - a[0]).map(it => {
        const [ms, o, h, l, c] = it;
        const date = new Date(ms);
        const result = {
            LastRefreshed: [date.getFullYear(), (date.getMonth() + 1), date.getDate()].join("-"),
            Open: o,
            High: h,
            Low: l,
            Close: c,
            Volume: 0,
        };
        return result;
    });
}

async function fetchExchangeRate(from, to) {
    const response = await transport.cryptoRate(from, to);
    const result = buildFromAlphaRate(from, to, response.data);
    return result;
}

async function fetchExchangeDaily(from, to) {
    const response = await transport.cryptoDaily(from, to);
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
    const response = await transport.cryptoListingStatus();
    const mapped = response.data
        .filter(it => it.symbol && it.id)
        .map(it => {
            return { code: it.symbol, name: it.id }
        });
    return mapped;
}

module.exports = {
    fetchAll,
    fetchExchangeRate,
    fetchExchangeDaily,
    fetchExchangeCalculated,
    fetchValidListing,
}