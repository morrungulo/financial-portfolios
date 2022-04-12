const axios = require('axios');
const config = require('config');

const instance = axios.create({
  baseURL: 'https://alpha-vantage.p.rapidapi.com',
  headers: {
    'content-type': 'application/octet-stream',
    'x-rapidapi-host': 'alpha-vantage.p.rapidapi.com',
    'x-rapidapi-key': config.get('alphavantage.apikey')
  }
});

module.exports = {
  stockOverview: (symbol) =>
    instance({
      'method': 'GET',
      'url': '/query',
      'params': {
        'datatype': 'json',
        'function': 'OVERVIEW',
        'symbol': symbol.toUpperCase()
      },
    }),

  stockQuote: (symbol) =>
    instance({
      'method': 'GET',
      'url': '/query',
      'params': {
        'datatype': 'json',
        'function': 'GLOBAL_QUOTE',
        'symbol': symbol.toUpperCase()
      },
    }),

  stockListingStatus: () =>
    instance({
      'method': 'GET',
      'url': '/query',
      'responseType': 'blob',
      'params': {
        'function': 'LISTING_STATUS'
      }
    }),

  stockDailyAdjusted: (symbol) =>
    instance({
      'method': 'GET',
      'url': '/query',
      'params': {
        'outputsize': 'full',
        'datatype': 'json',
        'function': 'TIME_SERIES_DAILY_ADJUSTED',
        'symbol': symbol.toUpperCase()
      },
    }),

  currencyExchangeRate: (from_currency, to_currency) =>
    instance({
      'method': 'GET',
      'url': '/query',
      'params': {
        'datatype': 'json',
        'function': 'CURRENCY_EXCHANGE_RATE',
        'from_currency': from_currency.toUpperCase(),
        'to_currency': to_currency.toUpperCase()
      },
    }),

  forexDaily: (from_currency, to_currency) =>
    instance({
      'method': 'GET',
      'url': '/query',
      'params': {
        'datatype': 'json',
        'outputsize': 'full',
        'function': 'FX_DAILY',
        'from_symbol': from_currency.toUpperCase(),
        'to_symbol': to_currency.toUpperCase()
      },
    }),

}
