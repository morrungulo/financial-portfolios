const axios = require('axios');

const instance = axios.create({
    baseURL: 'https://api.coingecko.com/api/v3',
    headers: {
        'accept': 'application/json'
    }
});

module.exports = {
    cryptoListingStatus: () =>
        instance({
            'method': 'GET',
            'url': '/coins/list',
            'params': {
                'include_platform': false
            }
        }),

    cryptoDaily: (from, to) =>
        instance({
            'method': 'GET',
            'url': '/coins/' + from.toLowerCase() + '/ohlc',
            'params': {
                'vs_currency': to.toLowerCase(),
                'days': 'max'
            },
        }),

    cryptoRate: (from, to) =>
        instance({
            'method': 'GET',
            'url': '/simple/price',
            'params': {
                'ids': from.toLowerCase(),
                'vs_currencies': to.toLowerCase()
            },
        }),

}
