const config = require('config');
const chalk = require('chalk');
const Watchlist = require('../models/Watchlist');
const StockService = require('../services/StockService');

const splitOnce = (s, on) => {
    [first, second, ...rest] = s.split(on)
    return [first, second, rest.length > 0? rest.join(on) : null]
}

const handleErrors = (err) => {
    console.log(chalk.red(err.message, err.code));
    let errors = { watchlist: '', exchangestock: '' };

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
    if (err.message.includes('watchlist validation failed')) {
        Object.values(err.errors).map(properties => {
            errors.watchlist = properties.message;
        });
    }

    return errors;
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
    const { id } = req.body;
    try {
        let removed = await Watchlist.findByIdAndDelete(id);
        res.status(201).json({ removed });
    }
    catch (err) {
        const errors = handleErrors(err);
        res.status(400).json({ errors });
    }
}

module.exports.watchlists_detail = async (req, res) => {
    const wid = req.params.wid;
    try {
        let watchlist = await Watchlist.findById(wid);
        await watchlist
            .populate({path: 'stock_entries'})
            // .populate({path: 'crypto_entries'})
            // .populate({path: 'cash_entries'})
            .execPopulate();
        res.render('watchlists/watchlists-detail', { title: watchlist.name, watchlist });
    }
    catch (err) {
        const errors = handleErrors(err);
        res.status(400).json({ errors });
    }
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
                throw Error('controller:ticker:That ticker could not be found');
            }
            const hasStock = await SS.hasStock(ticker);
            if (hasStock) {
                entry = await SS.getStock(ticker);
            } else {
                entry = await SS.createStock(ticker);
                if (!entry) {
                    throw Error('controller:ticker:Could not satisfy request - please try later');
                }
            }

            // is it already in watchlist?
            const alreadyInWatchlist = await Watchlist.findOne({'_id': watchlist._id, 'stock_entries': { $in: [entry._id] }});
            if (alreadyInWatchlist) {
                throw Error('controller:ticker:That ticker is already in the watchlist');
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
    const { kind, id } = req.body;
    const wid = req.params.wid;

    try {
        // get the watchlist
        let watchlist = await Watchlist.findById(wid);
        if (!watchlist) {
            throw Error('controller:remove:Unknown watchlist');
        }
        
        let removed = null;
        if (kind == 'Stock') {

            // remove it from our list
            removed = watchlist.stock_entries.pull({ _id: id });

        } else if (kind == 'Crypto') {
            
        } else if (kind == 'Cash') {

        }

        // save watchlist
        watchlist.save(err => {
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
