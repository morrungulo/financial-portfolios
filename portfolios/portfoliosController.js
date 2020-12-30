const config = require('config');
const chalk = require('chalk');
const Portfolio = require('../models/Portfolio');


/**
 * Handle errors on assets.
 * 
 * @param {*} err 
 */
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


/**
 * Handle errors on portfolios.
 * 
 * @param {*} err 
 */
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


/**
 * GET portfolios.
 * 
 * @param {*} req 
 * @param {*} res 
 */
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


/**
 * GET portfolios create
 * @param {*} req 
 * @param {*} res 
 */
module.exports.portfolios_create_get = (req, res) => {
    res.render('portfolios-create', { title: 'Create Portfolio' });
}


/**
 * POST portfolios create
 * 
 * @param {*} req 
 * @param {*} res 
 */
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


/**
 * GET portfolios id
 * 
 * @param {*} req 
 * @param {*} res 
 */
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


/**
 * GET portfolios id create
 * 
 * @param {*} req 
 * @param {*} res 
 */
module.exports.portfolios_id_create_get = (req, res) => {
    res.locals.portfolio_id = req.params.pid;
    res.render('asset-create', { title: 'Create Asset' });
}


/**
 * POST portfolios id create
 * 
 * @param {*} req 
 * @param {*} res 
 */
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


/**
 * POST portfolios id remove
 * 
 * @param {*} req 
 * @param {*} res 
 */
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


/**
 * GET portfolios id asset id
 * @param {*} req 
 * @param {*} res 
 */
module.exports.portfolios_id_asset_id_get = (req, res) => {
    res.send('NOT IMPLEMENTED: portfolios_id_asset_id_get');
}
