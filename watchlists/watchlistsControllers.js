const config = require('config');
const chalk = require('chalk');
const ExchangeStock = require('../models/stock/Exchange');
const ExchangeCrypto = require('../models/crypto/Exchange');
const ExchangeForex = require('../models/cash/Exchange');
const Watchlist = require('../models/Watchlist');
const StockService = require('../services/StockService');

const handleErrors = (err) => {
    console.log(chalk.red(err.message, err.code));
    let errors = { watchlist: '', ticker: '', fromCrypto: '', toCrypto: '', fromCurrency: '', toCurrency: '' };

    if (err.message === 'invalid ticker') {
        errors.ticker = 'That ticker could not be found';
    }

    if (err.message === 'already in watchlist') {
        errors.ticker = 'That ticker is already in the watchlist';
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
    if (err.message.includes('watchlist validation failed')) {
        Object.values(err.errors).map(properties => {
            errors[properties.path] = properties.message;
        });
    }

    return errors;
}

module.exports.watchlists_create_get = async (req, res) => {
    res.render('watchlists-create', { title: 'Create Watchlist' });
}

module.exports.watchlists_create_post = async (req, res) => {
    const { name } = req.body;
    const user_id = res.locals.user._id;
    try {
        let watchlist = await Watchlist.create({ name, user_id });
        res.status(201).json({ watchlist });
    }
    catch (err) {
        const errors = handleErrors(err);
        res.status(400).json({ errors });
    }
}

module.exports.watchlists_remove_post = async (req, res) => {
    res.send("Not implemented - watchlists_remove_post!");
}

module.exports.watchlists_detail = async (req, res) => {
    const wid = req.params.wid;
    try {
        let watchlist = await Watchlist.findById(wid);
        await watchlist
            .populate({path: 'stock_entries'})
            .populate({path: 'crypto_entries'})
            .populate({path: 'cash_entries'})
            .execPopulate();
        res.render('watchlists-detail', { title: watchlist.name, watchlist });
    }
    catch (err) {
        const errors = handleErrors(err);
        res.status(400).json({ errors });
    }
}

module.exports.watchlists_entries_create_get = async (req, res) => {
    const wid = req.params.wid;
    res.render('entries-create', { title: 'Add Entry', watchlist_id: wid });
}

module.exports.watchlists_entries_create_post = async (req, res) => {
    const { kind, ticker, fromCrypto, toCrypto, fromCurrency, toCurrency } = req.body;
    const wid = req.params.wid;

    try {
        // get the watchlist
        let watchlist = await Watchlist.findById(wid);
        
        // create entry
        let entry = null;
        if (kind === 'Stock') {
            
            // get the stock
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

            // is it already in watchlist?
            const alreadyInWatchlist = await Watchlist.findOne({"_id": watchlist._id, "stock_entries.name": entry.name});
            if (alreadyInWatchlist) {
                throw Error('already in watchlist');
            }

            // add to watchlist
            watchlist.stock_entries.push(entry._id);

        } else if (kind === 'Crypto') {

        } else if (kind === 'Cash') {

        }

        // save portfolio
        watchlist.save(err => {
            if (err) {
                const errors = handleErrors(err);
                res.status(400).json({ errors });
            } else {
                res.status(201).json({ entry });
            }
        });
    }
    catch (err) {
        const errors = handleErrors(err);
        res.status(400).json({ errors });
    }
}

module.exports.watchlists_entries_remove_post = async (req, res) => {
    res.send("Not implemented - watchlists_entry_remove_post!");
}

module.exports.watchlists_entries_detail = async (req, res) => {
    res.send("Not implemented - watchlists_entry_detail!");
}
