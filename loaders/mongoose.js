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
        // mongodb standalone docker
        // -- docker run -p 27017:27017 --name mongodb -v data:/data/db --rm -d mongo --bind_ip 0.0.0.0
        const dbURI = 'mongodb://172.17.0.1:27017/' + config.get('mongodb.dbname');

        // run mongo inside the container
        // -- docker exec -it mongodb /bin/bash

        // mongodb docker-compose
        // -- docker-compose up
        // const dbURI = 'mongodb://mongodb:27017/' + config.get('mongodb.dbname');

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