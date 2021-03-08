const config = require('config');
const Portfolio = require('../models/Portfolio');
const Watchlist = require('../models/Watchlist');
const { calculatePortfolioFromExchangeData } = require('../portfolios/portfoliosCalculator');


const handleErrors = (err) => {
    console.log(err.message, err.code);
    let errors = { portfolio: '', watchlist: '' };

    // validation errors
    if (err.message.includes('portfolio validation failed')) {
        Object.values(err.errors).forEach(({ properties }) => {
            errors[properties.path] = properties.message;
        });
    }

    // validation errors
    if (err.message.includes('watchlist validation failed')) {
        Object.values(err.errors).forEach(({ properties }) => {
            errors[properties.path] = properties.message;
        });
    }

    return errors;
}

/**
 * GET user portfolios and watchlists
 * 
 * @param {*} req 
 * @param {*} res 
 */
module.exports.index = async (req, res) => {
    const user_id = res.locals.user._id;
    try {
        const [portfolios, watchlists] = await Promise.all([
            Portfolio.find({ user_id }).sort({ portfolio: 1 }),
            Watchlist.find({ user_id }).sort({ watchlist: 1 })
        ]);
        res.locals.portfolios = portfolios;
        res.locals.watchlists = watchlists;
        res.render('show', {title: "Portfolios and Watchlists", currencies: config.get('currencies')});
    }
    catch (err) {
        const errors = handleErrors(err);
        return res.status(500).json(err);
    }
}

module.exports.recalculate = async (req, res) => {
    const user_id = res.locals.user._id;
    try {
        const portfolios = await Portfolio.find({ user_id });
        const portfolioActions = portfolios.map(portfolio => calculatePortfolioFromExchangeData(portfolio._id));
        await Promise.all(portfolioActions);
        res.redirect('.');
    }
    catch (err) {
        const errors = handleErrors(err);
        res.status(400).json({ errors });
    }
}