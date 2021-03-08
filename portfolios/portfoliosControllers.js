const config = require('config');
const chalk = require('chalk');
const Portfolio = require('../models/Portfolio');
const StockService = require('../services/StockService');
const AssetStock = require('../models/stock/Asset');
const CryptoService = require('../services/CryptoService');
const AssetCrypto = require('../models/crypto/Asset');
const { calculatePortfolioFromExchangeData } = require('./portfoliosCalculator');

const splitOnce = (s, on) => {
    [first, second, ...rest] = s.split(on)
    return [first, second, rest.length > 0? rest.join(on) : null]
}

const handleErrors = (err) => {
    console.log(chalk.red(err.message, err.code));
    let errors = { portfolio: '', exchangestock: '', exchangecrypto: '' };

    if (err.message.startsWith("controller")) {
        const [ctrl, code, message] = splitOnce(err.message, ':');
        errors[code] = message;
    }

    // validation errors
    if (err.message.includes('exchangestock validation failed')) {
        Object.values(err.errors).map(properties => {
            errors.exchangestock = properties.message;
        });
    }
            
    // validation errors
    if (err.message.includes('exchangecrypto validation failed')) {
        Object.values(err.errors).map(properties => {
            errors.exchangecrypto = properties.message;
        });
    }
            
    // validation errors
    if (err.message.includes('portfolio validation failed')) {
        Object.values(err.errors).map(properties => {
            errors.portfolio = properties.message;
        });
    }

    return errors;
}

module.exports.portfolios_create_post = async (req, res) => {
    const { name, currency } = req.body;
    const user_id = res.locals.user._id;
    try {
        let portfolio = await Portfolio.create({ name, user_id, currency });
        res.status(201).json({ portfolio });
    }
    catch (err) {
        const errors = handleErrors(err);
        res.status(400).json({ errors });
    }
}

module.exports.portfolios_remove_post = async (req, res) => {
    const { id } = req.body;
    try {
        let removed = await Portfolio.findByIdAndDelete(id);
        res.status(201).json({ removed });
    }
    catch (err) {
        const errors = handleErrors(err);
        res.status(400).json({ errors });
    }
}

module.exports.portfolios_detail = async (req, res) => {
    const pid = req.params.pid;
    try {
        const portfolio = await Portfolio.findById(pid)
            .populate({path: 'stock_assets', populate: {path: 'exchange_id'}})
            .populate({path: 'crypto_assets', populate: {path: 'exchange_id'}})
            .populate({path: 'cash_assets', populate: {path: 'exchange_id'}})
        res.render('portfolios/portfolios-detail', { title: portfolio.name, portfolio, currencies: config.get('currencies') });
    }
    catch (err) {
        const errors = handleErrors(err);
        res.status(400).json({ errors });
    }
}

module.exports.portfolios_recalculate = async (req, res) => {
    const pid = req.params.pid;
    try {
        await calculatePortfolioFromExchangeData(pid);
        res.redirect('.');
    }
    catch (err) {
        const errors = handleErrors(err);
        res.status(400).json({ errors });
    }
}

module.exports.portfolios_assets_create_post = async (req, res) => {
    const { kind, ticker, crypto, currency } = req.body;
    const pid = req.params.pid;

    try {
        // get the portfolio
        const portfolio = await Portfolio.findById(pid);
        const currency = portfolio.currency;
        
        // create asset
        let asset = null;
        if (kind == 'Stock') {

            // get the stock 
            let entry = null;
            const service = new StockService();
            const isValid = await service.isTickerValid(ticker);
            if (!isValid) {
                throw Error('controller:ticker:That ticker could not be found');
            }
            const hasStock = await service.hasStock(ticker);
            if (hasStock) {
                entry = await service.getStock(ticker);
            } else {
                entry = await service.createStock(ticker);
                if (!entry) {
                    throw Error('controller:ticker:Could not satisfy request - please try later');
                }
            }

            // is it already in portfolio?
            const alreadyInPortfolio = await AssetStock.findOne({ 'portfolio_id': portfolio._id, 'exchange_id': entry._id });
            if (alreadyInPortfolio) {
                throw Error('controller:ticker:That ticker is already in the portfolio');
            }

            // create asset and add to portfolio
            asset = await AssetStock.create({ portfolio_id: portfolio._id, exchange_id: entry._id });
            
            // push to list but sort list
            portfolio.stock_assets.push(asset._id);
            
        } else if (kind == 'Crypto') {

            // get the crypto 
            let entry = null;
            const service = new CryptoService();
            const isValid = await service.isCryptoValid(crypto);
            if (!isValid) {
                throw Error('controller:crypto:That crypto could not be found');
            }
            const hasCrypto = await service.hasCrypto(crypto, currency);
            if (hasCrypto) {
                entry = await service.getCrypto(crypto, currency);
            } else {
                entry = await service.createCrypto(crypto, currency);
                if (!entry) {
                    throw Error('controller:crypto:Could not satisfy request - please try later');
                }
            }

            // is it already in portfolio?
            const alreadyInPortfolio = await AssetCrypto.findOne({ 'portfolio_id': portfolio._id, 'exchange_id': entry._id });
            if (alreadyInPortfolio) {
                throw Error('controller:crypto:That crypto is already in the portfolio');
            }

            // create asset and add to portfolio
            asset = await AssetCrypto.create({ portfolio_id: portfolio._id, exchange_id: entry._id });
            
            // push to list but sort list
            portfolio.crypto_assets.push(asset._id);
            
        } else if (kind == 'Cash') {
            
        }

        // save portfolio
        portfolio.save(err => {
            if (err) {
                const errors = handleErrors(err);
                res.status(400).json({ errors });
            } else {
                res.status(201).json({ asset });
            }
        });
    }
    catch (err) {
        const errors = handleErrors(err);
        res.status(400).json({ errors });
    }
}

module.exports.portfolios_assets_remove_post = async (req, res) => {
    const { kind, id } = req.body;
    const pid = req.params.pid;

    try {
        // get the portfolio
        let portfolio = await Portfolio.findById(pid);
        if (!portfolio) {
            throw Error('controller:remove:Unknown portfolio');
        }
        
        let removed = null;
        if (kind == 'Stock') {

            // find the asset with id
            removed = await AssetStock.findOneAndDelete({ _id: id, portfolio_id: portfolio._id });
            if (!removed) {
                throw Error('controller:remove:Could not find this asset in the portfolio');
            }
            // remove it from our list
            portfolio.stock_assets.pull({ _id: id });

        } else if (kind == 'Crypto') {
            
        } else if (kind == 'Cash') {

        }

        // save portfolio
        portfolio.save(err => {
            if (err) {
                const errors = handleErrors(err);
                res.status(400).json({ errors });
            } else {
                res.status(201).json({ removed });
            }
        });
    }
    catch (err) {
        const errors = handleErrors(err);
        res.status(400).json({ errors });
    }
}