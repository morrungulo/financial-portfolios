const config = require('config');
const chalk = require('chalk');
const ExchangeStock = require('../models/stock/Exchange');
const ExchangeCrypto = require('../models/crypto/Exchange');
const ExchangeForex= require('../models/cash/Exchange');

const handleErrors = (err) => {
    console.log(chalk.red(err.message, err.code));
    const errors = { exchangestock: '', exchangecrypto: '', exchangeforex: '' };

    // validation errors
    if (err.message.includes('exchangestock validation failed')) {
        Object.values(err.errors).map(properties => {
            errors[properties.path] = properties.message;
        });
    }

    // validation errors
    if (err.message.includes('exchangecrypto validation failed')) {
        Object.values(err.errors).map(properties => {
            errors[properties.path] = properties.message;
        });
    }

    // validation errors
    if (err.message.includes('exchangeforex validation failed')) {
        Object.values(err.errors).map(properties => {
            errors[properties.path] = properties.message;
        });
    }

    return errors;
}

module.exports.exchanges_stock_detail = async (req, res) => {
    const eid = req.params.eid;
    try {
        const entry = await ExchangeStock.findById(eid);
        res.render('exchanges/stock/exchanges-detail', { title: entry.name, entry });
    }
    catch (err) {
        const errors = handleErrors(err);
        res.status(400).json({ errors });
    }
}

module.exports.exchanges_crypto_detail = async (req, res) => {
    const eid = req.params.eid;
    try {
        const entry = await ExchangeCrypto.findById(eid);
        res.render('exchanges/crypto/exchanges-detail', { title: entry.shortName, entry });
    }
    catch (err) {
        const errors = handleErrors(err);
        res.status(400).json({ errors });
    }
}

module.exports.exchanges_cash_detail = async (req, res) => {
    const eid = req.params.eid;
    try {
        const entry = await ExchangeForex.findById(eid);
        res.render('exchanges/cash/exchanges-detail', { title: entry.shortName, entry });
    }
    catch (err) {
        const errors = handleErrors(err);
        res.status(400).json({ errors });
    }
}