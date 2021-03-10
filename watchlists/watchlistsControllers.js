const config = require('config');
const chalk = require('chalk');
const Watchlist = require('../models/Watchlist');
const StockService = require('../services/StockService');
const CryptoService = require('../services/CryptoService');
const ForexService = require('../services/ForexService');
const { getFileName, downloadResource } = require('../util')

const splitOnce = (s, on) => {
    [first, second, ...rest] = s.split(on)
    return [first, second, rest.length > 0 ? rest.join(on) : null]
}

const handleErrors = (err) => {
    console.log(chalk.red(err.message, err.code));
    let errors = { watchlist: '', exchangestock: '', exchangecrypto: '', exchangeforex: '' };

    if (err.message.startsWith("controller")) {
        const [ctrl, code, message] = splitOnce(err.message, ':');
        errors[code] = message;
    }

    // validation errors
    if (err.message.includes('watchlist validation failed')) {
        Object.values(err.errors).map(properties => {
            errors.watchlist = properties.message;
        });
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
    
    return errors;
}

module.exports.watchlists_create_post = async (req, res) => {
    const { name } = req.body;
    const user_id = res.locals.user._id;
    try {
        const watchlist = await Watchlist.create({ name, user_id });
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
        const watchlist = await Watchlist.findByIdAndDelete(id);
        res.status(201).json({ watchlist });
    }
    catch (err) {
        const errors = handleErrors(err);
        res.status(400).json({ errors });
    }
}

module.exports.watchlists_detail = async (req, res) => {
    const wid = req.params.wid;
    try {
        const watchlist = await Watchlist.findById(wid)
            .populate({path: 'stock_entries'})
            .populate({path: 'crypto_entries'})
            .populate({path: 'cash_entries'});
        res.render('watchlists/watchlists-detail', { title: watchlist.name, watchlist });
    }
    catch (err) {
        const errors = handleErrors(err);
        res.status(400).json({ errors });
    }
}

module.exports.watchlists_export = async (req, res) => {
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
                const fileName = getFileName('watchlist', entry.name);
                downloadResource(res, fileName, fields, entry.stock_entries);
            })
            .catch(err => res.send(err));
    }
    catch (err) {
        const errors = handleErrors(err);
        res.status(400).json({ errors });
    }
}

const pushToListAndSave = async (wdoc, wlist, exchange_id) => {
    wlist.push(exchange_id);
    await wdoc.save();
}

module.exports.watchlists_entries_create_post = async (req, res) => {
    const { kind, ticker, fromCrypto, toCrypto, fromCurrency, toCurrency } = req.body;
    const wid = req.params.wid;

    try {
        // get the watchlist
        const watchlist = await Watchlist.findById(wid);
        let exItem = null;
        if (kind === 'Stock') {
            
            const service = new StockService();
            exItem = await service.retrieveOrUpsert(ticker);
            const alreadyInWatchlist = await Watchlist.findOne({'_id': watchlist._id, 'stock_entries': { $in: [exItem._id] }});
            if (alreadyInWatchlist) {
                throw Error('controller:kind:That ticker is already in the watchlist');
            }
            await pushToListAndSave(watchlist, watchlist.stock_entries, exItem._id);

        } else if (kind === 'Crypto') {

            const service = new CryptoService();
            exItem = await service.retrieveOrUpsert(fromCrypto, toCrypto);
            const alreadyInWatchlist = await Watchlist.findOne({'_id': watchlist._id, 'crypto_entries': { $in: [exItem._id] }});
            if (alreadyInWatchlist) {
                throw Error(`controller:kind:The crypto combination ${fromCrypto}-${toCrypto} is already in the watchlist!`);
            }
            await pushToListAndSave(watchlist, watchlist.crypto_entries, exItem._id);

        } else if (kind === 'Cash') {

            const service = new ForexService();
            exItem = await service.retrieveOrUpsert(fromCurrency, toCurrency);
            const alreadyInWatchlist = await Watchlist.findOne({'_id': watchlist._id, 'cash_entries': { $in: [exItem._id] }});
            if (alreadyInWatchlist) {
                throw Error(`controller:kind:The currency combination ${fromCurrency}-${toCurrency} is already in the watchlist!`);
            }
            await pushToListAndSave(watchlist, watchlist.cash_entries, exItem._id);
            
        }
        res.status(201).json({entry: exItem });
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
