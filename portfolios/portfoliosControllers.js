const config = require('config');
const chalk = require('chalk');
const Portfolio = require('../models/Portfolio');
const StockService = require('../services/StockService');
const AssetStock = require('../models/stock/Asset');
const CryptoService = require('../services/CryptoService');
const ForexService = require('../services/ForexService');
const AssetCrypto = require('../models/crypto/Asset');
const { calculatePortfolioFromExchangeData } = require('./portfoliosCalculator');
const AssetCash = require('../models/cash/Asset');

const splitOnce = (s, on) => {
    [first, second, ...rest] = s.split(on)
    return [first, second, rest.length > 0? rest.join(on) : null]
}

const handleErrors = (err) => {
    console.log(chalk.red(err.message, err.code));
    let errors = { portfolio: '', exchangestock: '', exchangecrypto: '', exchangeforex: '' };

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
    if (err.message.includes('exchangeforex validation failed')) {
        Object.values(err.errors).map(properties => {
            errors.exchangeforex = properties.message;
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

const throwIfInPortfolio = async (assetModel, portfolio_id, exchange_id) => {
    if (await assetModel.exists({ 'portfolio_id': portfolio_id, 'exchange_id': exchange_id })) {
        throw Error('controller:kind:Already in portfolio');
    }
}

const createNewDocument = async (assetModel, portfolio_id, exchange_id) => {
    return await assetModel.create({ 'portfolio_id': portfolio_id, 'exchange_id': exchange_id });
}

const pushToListAndSave = async (pdoc, plist, asset_id) => {
    plist.push(asset_id);
    await pdoc.save();
}

module.exports.portfolios_assets_create_post = async (req, res) => {
    const { kind, ticker, fromCrypto, fromCurrency } = req.body;
    const pid = req.params.pid;

    try {
        // get the portfolio
        const portfolio = await Portfolio.findById(pid);
        const toCurrency = portfolio.currency;
        let asset = null;
        if (kind == 'Stock') {

            const service = new StockService();
            const exItem = await service.retrieveOrUpsert(ticker);
            await throwIfInPortfolio(AssetStock, portfolio._id, exItem._id);
            asset = await createNewDocument(AssetStock, portfolio._id, exItem._id);
            await pushToListAndSave(portfolio, portfolio.stock_assets, asset._id);

        } else if (kind == 'Crypto') {

            const service = new CryptoService();
            const exItem = await service.retrieveOrUpsert(fromCrypto, toCurrency);
            await throwIfInPortfolio(AssetCrypto, portfolio._id, exItem._id);
            asset = await createNewDocument(AssetCrypto, portfolio._id, exItem._id);
            await pushToListAndSave(portfolio, portfolio.crypto_assets, asset._id);

        } else if (kind == 'Cash') {

            const service = new ForexService();
            const exItem = await service.retrieveOrUpsert(fromCurrency, toCurrency);
            await throwIfInPortfolio(AssetCash, portfolio._id, exItem._id);
            asset = await createNewDocument(AssetCash, portfolio._id, exItem._id);
            await pushToListAndSave(portfolio, portfolio.cash_assets, asset._id);
        
        }
        res.status(201).json({ asset });
    }
    catch (err) {
        const errors = handleErrors(err);
        res.status(400).json({ errors });
    }
}

module.exports.portfolios_assets_remove_post = async (req, res) => {
    const { kind, id } = req.body;
    const pid = req.params.pid;

    // define parameters
    const assetMap = {
        'Stock': AssetStock,
        'Crypto': AssetCrypto,
        'Cash': AssetCash,
    };
    const listMap = {
        'Stock': 'stock_assets',
        'Crypto': 'crypto_assets',
        'Cash': 'cash_assets',
    };

    try {

        // some error checking first
        if (!assetMap.hasOwnProperty(kind)) {
            throw Error(`${kind} is not supported!`);
        }

        // create pull object info
        const pullEntry = {};
        pullEntry[listMap[kind]] = id;

        // execute
        const [dummy, assetRemoved] = await Promise.all([
            Portfolio.findByIdAndUpdate(pid, {$pull : pullEntry}),
            assetMap[kind].findOneAndDelete({_id: id, portfolio_id: pid})
        ]);
        res.status(201).json({ assetRemoved });
        
    }
    catch (err) {
        const errors = handleErrors(err);
        res.status(400).json({ errors });
    }
}