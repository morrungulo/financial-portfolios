const config = require('config');
const chalk = require('chalk');
const { Parser } = require('json2csv');
const dateformat = require('dateformat');
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

/**
 * Sends the 'data' object filtered with the information in the 'fields' object as a 'csv'
 * file named 'fileName' as a response attachment. 
 * @param {HTTPResponse} res 
 * @param {String} fileName 
 * @param {Object} fields 
 * @param {Object} data 
 */
const downloadResource = (res, fileName, fields, data) => {
    const json2csv = new Parser({ fields });
    const csv = json2csv.parse(data);
    res.header('Content-Type', 'text/csv');
    res.header("Content-Disposition", 'attachment; filename=' + fileName);
    res.attachment(fileName);
    return res.send(csv);
}

/**
 * Returns a String with the proposed filename. It appends the date down to the second to the filename.
 * If the parameters are 'text', 'alice' and 'csv' respectively, the return name will be 'text-alice-20210102175534.csv'.

 * @param {String} filetype 
 * @param {String} name 
 * @param {String} extension 
 */
const getFileName = (filetype, name, extension) => {
    const date = dateformat(Date.now(), "yyyymmddHHMMss");
    const fileName = [filetype, name, date].join('-').toLowerCase();
    return fileName + '.' + extension;
}

module.exports.watchlists_export2csv = async (req, res) => {
    const wid = req.params.wid;
    try {
        const fields = [
            { label: 'Name', value: 'exchangeOverview.Name' },
            { label: 'Ticker', value: 'name' },
            { label: 'Sector', value: 'exchangeOverview.Sector' },
            { label: '52wk High', value: 'exchangeOverview.Week52High' },
            { label: '52wk Low', value: 'exchangeOverview.Week52Low' },
            { label: '52wk Range', value: 'exchangeCalculated.Week52RangePercent' },
            { label: 'Price', value: 'exchangeQuote.Price' },
            { label: 'Open', value: 'exchangeQuote.Open' },
            { label: 'High', value: 'exchangeQuote.High' },
            { label: 'Low', value: 'exchangeQuote.Low' },
            { label: 'Close', value: 'exchangeQuote.PreviousClose' },
            { label: 'Volume', value: 'exchangeQuote.Volume' },
            { label: 'Change', value: 'exchangeQuote.Change' },
            { label: 'Change%', value: 'exchangeQuote.ChangePercent' },
            { label: 'P/E', value: 'exchangeOverview.PERatio' },
            { label: 'EPS', value: 'exchangeOverview.EPS' },
            { label: 'Dividend', value: 'exchangeOverview.Dividend' },
            { label: 'Dividend Yield', value: 'exchangeCalculated.DividendYieldPercent' },
            { label: 'Dividend Payout', value: 'exchangeCalculated.DividendPayoutRatioPercent' },
        ];
        Watchlist.findById(wid)
            .populate({path: 'stock_entries'})
            .lean()
            .exec()
            .then(entry => {
                const fileName = getFileName('watchlist', entry.name, 'csv');
                downloadResource(res, fileName, fields, entry.stock_entries);
            })
            .catch(err => res.send(err));
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

    const mapp = { 'Stock': 'stock_entries', 'Crypto': 'crypto_entries', 'Cash': 'cash_entries' };
    if (mapp[kind]) {
        let ssobj = {};
        ssobj[mapp[kind]] = id;
        Watchlist.findByIdAndUpdate(wid, {$pull: ssobj}, (err, data) => {
            if (err) {
                const errors = handleErrors(err);
                res.status(400).json({ errors });
            } else {
                res.status(201).json({});
            }
        });
    }
}
