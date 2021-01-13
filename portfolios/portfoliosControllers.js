const config = require('config');
const chalk = require('chalk');
const Portfolio = require('../models/Portfolio');
const StockService = require('../services/StockService');
const AssetStock = require('../models/stock/Asset');

const handleErrors = (err) => {
    console.log(chalk.red(err.message, err.code));
    let errors = { portfolio: '', ticker: '', fromCrypto: '', toCrypto: '', fromCurrency: '', toCurrency: '' };

    if (err.message === 'invalid ticker') {
        errors.ticker = 'That ticker could not be found';
    }

    if (err.message === 'already in portfolio') {
        errors.ticker = 'That ticker is already in the portfolio';
    }

    if (err.message === 'transaction limits') {
        errors.ticker = 'Could not satisfy request - please try later';
    }

    // validation errors
    if (err.message.includes('exchangestock validation failed')) {
        Object.values(err.errors).map(properties => {
            errors.ticker = properties.message;
        });
    }
            
    // validation errors
    if (err.message.includes('portfolio validation failed')) {
        Object.values(err.errors).map(properties => {
            errors[properties.path] = properties.message;
        });
    }

    return errors;
}

module.exports.portfolios_create_get = async (req, res) => {
    res.render('portfolios/portfolios-create', { title: 'Add Portfolio', currencies: config.get('currencies') });
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
    res.send("Not implemented - portfolios_remove_post!");
}

module.exports.portfolios_detail = async (req, res) => {
    const pid = req.params.pid;
    try {
        let portfolio = await Portfolio.findById(pid);
        await portfolio
            .populate({path: 'stock_assets', populate: {path: 'exchange_id'}})
            .populate({path: 'crypto_assets'})
            .populate({path: 'cash_assets'})
            .execPopulate();

        console.log(chalk.cyan(JSON.stringify(portfolio, null, "  ")));
        
        res.render('portfolios/portfolios-detail', { title: portfolio.name, portfolio });
    }
    catch (err) {
        const errors = handleErrors(err);
        res.status(400).json({ errors });
    }
}

module.exports.portfolios_assets_create_get = (req, res) => {
    const pid = req.params.pid;
    res.render('portfolios/assets-create', { title: 'Add Asset', currencies: config.get('currencies'), portfolio_id: pid });
}

module.exports.portfolios_assets_create_post = async (req, res) => {
    const { kind, ticker, crypto, currency } = req.body;
    const pid = req.params.pid;

    try {
        // get the portfolio
        let portfolio = await Portfolio.findById(pid);
        
        // create asset
        let asset = null;
        if (kind == 'Stock') {

            // get the stock 
            let entry = null;
            const SS = new StockService();
            const isValid = await SS.isTickerValid(ticker);
            if (!isValid) {
                throw Error('invalid ticker');
            }
            const hasStock = await SS.hasStock(ticker);
            if (hasStock) {
                entry = await SS.getStock(ticker);
            } else {
                entry = await SS.createStock(ticker);
                if (!entry) {
                    throw Error('transaction limits');
                }
            }

            // is it already in portfolio?
            const alreadyInPortfolio = await AssetStock.findOne({ 'portfolio_id': portfolio._id, 'exchange_id': entry._id });
            if (alreadyInPortfolio) {
                throw Error('already in portfolio');
            }

            // create asset and add to portfolio
            asset = new AssetStock({ portfolio_id: portfolio._id, exchange_id: entry._id });
            await asset.save();
            portfolio.stock_assets.push(asset._id);
            
        } else if (kind == 'Crypto') {
            
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

module.exports.portfolios_assets_detail = async (req, res) => {
    res.send("Not implemented - portfolios_asset_detail!");
}

module.exports.portfolios_assets_remove_post = async (req, res) => {
    res.send("Not implemented - portfolios_asset_remove_post!");
}

module.exports.portfolios_assets_transactions_create_get = async (req, res) => {
    res.send("Not implemented - portfolios_assets_transactions_create_get!");
}

module.exports.portfolios_assets_transactions_create_post = async (req, res) => {
    res.send("Not implemented - portfolios_assets_transactions_create_post!");
}

module.exports.portfolios_assets_transactions_remove_post = async (req, res) => {
    res.send("Not implemented - portfolios_assets_transactions_remove_post!");
}

module.exports.portfolios_assets_transactions_detail = async (req, res) => {
    res.send("Not implemented - portfolios_assets_transactions_detail!");
}

module.exports.portfolios_assets_transactions_update = async (req, res) => {
    res.send("Not implemented - portfolios_assets_transactions_update!");
}

/*

const handleAssetErrors = (err) => {
    console.log(err.message, err.code);
    let errors = { ticker: '', crypto: '' };
    
    // validation errors
    if (err.message.includes('portfolio validation failed')) {
        Object.values(err.errors).forEach(({ properties }) => {
            errors[properties.path] = properties.message;
        });
    }

    return errors;    
}


const handleErrors = (err) => {
    console.log(err.message, err.code);
    let errors = { portfolio: '' };

    // validation errors
    if (err.message.includes('portfolio validation failed')) {
        Object.values(err.errors).forEach(({ properties }) => {
            errors[properties.path] = properties.message;
        });
    }

    return errors;
}


module.exports.portfolios_get = async (req, res) => {
    const user = res.locals.user._id;
    try {
        let portfolios = await Portfolio.find({ user })
            .sort({portfolio: 1});
        res.locals.portfolios = portfolios;
    }
    catch (err) {
        const errors = handleErrors(err);
        //todo
    }
    res.render('portfolios', {title: "Portfolios"});
}


module.exports.portfolios_create_get = (req, res) => {
    res.render('portfolios-create', { title: 'Create Portfolio' });
}


module.exports.portfolios_create_post = async (req, res) => {
    const { portfolio } = req.body;
    const user = res.locals.user._id;
    try {
        await Portfolio.create({ portfolio, user });
        res.status(201).json({ portfolio });
    }
    catch (err) {
        const errors = handleErrors(err);
        res.status(400).json({ errors });
    }
}


module.exports.portfolios_id_get = async (req, res) => {
    const portfolio_id = req.params.pid;
    let title = "";
    try {
        let portfolio = await Portfolio.findById(portfolio_id);
        res.locals.portfolio = portfolio;
        res.locals.assets = portfolio.assets;
        title = portfolio.portfolio;
    }
    catch (err) {
        const errors = handleErrors(err);
        //todo
    }
    res.render('portfolios-assets', {title});
}


module.exports.portfolios_id_create_get = (req, res) => {
    res.locals.portfolio_id = req.params.pid;
    res.render('asset-create', { title: 'Create Asset' });
}


module.exports.portfolios_id_create_post = async (req, res) => {
    const { kind, ticker, crypto } = req.body;
    const portfolio_id = req.params.pid;

    // todo - must check stock or crypto exists
    const name = (kind == 'Stock') ? ticker : (kind == 'Crypto') ? crypto : '';
    console.log(chalk.yellow(name));

    try {
        let portfolio = await Portfolio.findById(portfolio_id);
        console.log(chalk.yellow(portfolio));
        
        let asset = await portfolio.assets.create({ kind, name });
        console.log(chalk.yellow(asset));
        
        await portfolio.assets.push(asset);

        // save portfolio - needs improvement
        portfolio.save(async (err) => {
            if (err) {
                const errors = handleAssetErrors(err);
                res.status(400).json({ errors });
            } else {
                res.status(201).json({ asset });
            }
        });
    }
    catch (err) {
        const errors = handleAssetErrors(err);
        res.status(400).json({ errors });
    }
}


module.exports.portfolios_id_remove_post = async (req, res) => {
    const portfolio_id = req.params.pid;
    try {
        let docs = await Portfolio.findByIdAndDelete (portfolio_id);
        console.log(docs);
        res.status(201).json({ docs });
    }
    catch (err) {
        const errors = handleAssetErrors(err);
        res.status(400).json({ errors });
    }
}


module.exports.portfolios_id_asset_id_get = (req, res) => {
    res.send('NOT IMPLEMENTED: portfolios_id_asset_id_get');
}
*/
