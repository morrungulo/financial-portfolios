const config = require('config');
const mongoose = require('mongoose');
const ValidStock = require('../models/stock/Valid');
const ValidCrypto = require('../models/crypto/Valid');
const ValidForex = require('../models/cash/Valid');
const StockService = require('../services/StockService');
const CryptoService = require('../services/CryptoService');
const ForexService = require('../services/ForexService');

mongoose.connection.on('connected', async function () {
    const count = await ValidStock.estimatedDocumentCount();
    if (count === 0) {
        const service = new StockService();
        await service.updateValidStockListing();
    }
});

mongoose.connection.on('connected', async function () {
    const count = await ValidCrypto.estimatedDocumentCount();
    if (count === 0) {
        const service = new CryptoService();
        await service.updateValidCryptoListing();
    }
});

mongoose.connection.on('connected', async function () {
    const count = await ValidForex.estimatedDocumentCount();
    if (count === 0) {
        const service = new ForexService();
        await service.updateValidForexListing();
    }
});

module.exports = {
    initialize: async () => {

        // with mongodb docker image
        // const dbURI = `mongodb://172.17.0.1:${config.get('mongodb.port')}/${config.get('mongodb.dbname')}`;
        
        // with docker-compose
        const dbURI = `mongodb://mongodb:${config.get('mongodb.port')}/${config.get('mongodb.dbname')}`;

        // database connection
        try {
            await mongoose.connect(dbURI, {
                useNewUrlParser: true,
                useUnifiedTopology: true,
                useFindAndModify: false,
                useCreateIndex: true,
                socketTimeoutMS: 15000
            })
            console.log('Mongoose loaded!')
        } catch (err) {
            console.log(err);
        }
    }
}