const transport = require('../api/coingecko');
const chalk = require('chalk')

/**
 * Convert alpha data into mongodb schema data
 * @param {json} alpha 
 * @returns mongodb schema data
 */
const buildFromAlphaRate = (from, to, data) => {
    const rate = data[from][to.toLowerCase()]
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
    return alpha
        .sort((a, b) => b[0] - a[0])
        .map(it => {
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

const buildFromAlphaOverview = (from, alpha) => {
    return alpha
        .filter(a => a.id === from)
        .map(it => {
            const result = {
                Symbol: it.symbol,
                Name: it.name,
                Image: it.image,
                Price: it.current_price,
                MarketCap: it.market_cap,
                MarketCapRank: it.market_cap_rank,
                High24h: it.high_24h,
                Low24h: it.low_24h,
                PriceChange24h: it.price_change_24h,
                PriceChange24hPercentage: it.price_change_percentage_24h,
                MarketCapChange24h: it.market_cap_change_24h,
                MarketCapChange24hPercentage: it.market_cap_change_percentage_24h,
                CirculatingSupply: it.circulating_supply,
                TotalSupply: it.total_supply,
                HighAllTime: it.ath,
                HighAllTimeDate: it.ath_date,
                LowAllTime: it.atl,
                LowAllTimeDate: it.atl_date,
                ROI: it.roi?.percentage,
            }
            return result;
        })[0]
}

async function fetchExchangeOverview(from, to) {
    const response = await transport.cryptoOverview(from, to);
    const result = buildFromAlphaOverview(from, response.data);
    return result;
}

function fetchExchangeRate() {
    return {
        Rate: 0,
        High24h: 0,
        Low24h: 0,
    }
}

async function fetchExchangeDaily(from, to) {
    const response = await transport.cryptoDaily(from, to);
    const result = buildFromAlphaTimeSeries(response.data);
    return result;
}

function fetchExchangeCalculated() {
    return {
        Change: 0,
        ChangePercent: 0,
    }
}

async function fetchAll(from, to) {
    const result = await Promise.all([
        fetchExchangeRate(),
        fetchExchangeDaily(from, to),
        fetchExchangeCalculated(),
        fetchExchangeOverview(from, to),
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
    fetchExchangeDaily,
    fetchExchangeOverview,
    fetchValidListing,
}