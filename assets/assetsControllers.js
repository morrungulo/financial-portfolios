const config = require('config');
const chalk = require('chalk');
const AssetStock = require('../models/stock/Asset');
const TransactionStock = require('../models/stock/Transaction');

const splitOnce = (s, on) => {
    [first, second, ...rest] = s.split(on)
    return [first, second, rest.length > 0? rest.join(on) : null]
}

const handleErrors = (err) => {
    console.log(chalk.red(err.message, err.code));
    let errors = { assetstock: '', transactionstock: '' };

    if (err.message.startsWith("controller")) {
        const [ctrl, code, message] = splitOnce(err.message, ':');
        errors[code] = message;
    }

    // validation errors
    if (err.message.includes('assetstock validation failed')) {
        Object.values(err.errors).map(properties => {
            errors.assetstock = properties.message;
        });
    }

    // validation errors
    if (err.message.includes('transactionstock validation failed')) {
        Object.values(err.errors).map(properties => {
            errors.transactionstock = properties.message;
        });
    }
            
    return errors;
}

module.exports.assets_stocks_detail = async (req, res) => {
    const aid = req.params.aid;
    try {
        let asset = await AssetStock.findById(aid);
        await asset
            .populate({path: 'transactions', options: { sort : { date: -1 }}})
            .populate({path: 'portfolio_id'})
            .populate({path: 'exchange_id'})
            .execPopulate();
        res.render('assets/stocks-detail', { title: asset.exchange_id.name, asset });
    }
    catch (err) {
        const errors = handleErrors(err);
        res.status(400).json({ errors });
    }
}

const validateDate = (datetime) => {
    const date = new Date(datetime);
    if (date > Date.now()) {
        throw Error("controller:datetime:The date cannot be in the future");
    }
}

const validateBuyTransactionStock = (kind, quantity, price, commission) => {
    return validateSellTransactionStock(kind, quantity, price, commission);
}

const validateSellTransactionStock = (kind, quantity, price, commission) => {
    if (kind == 'buy' || kind == 'sell') {
        if (parseFloat(quantity) == 0) {
            throw Error("controller:quantity:This value cannot be zero");
        }
    }
}

const validateDividendTransactionStock = (kind, dividend) => {
    if (kind == 'dividend') {
        if (parseFloat(dividend) == 0) {
            throw Error("controller:dividend:This value cannot be zero");
        }
    }
}

const validateSplitTransactionStock = (kind, splitbefore, splitafter) => {
    if (kind == 'split') {
        if (parseInt(splitbefore) < 1) {
            throw Error("controller:splitbefore:This value cannot be less than one");
        } else if (parseInt(splitafter) < 1) {
            throw Error("controller:splitafter:This value cannot be less than one");
        }
    }
}

module.exports.transactions_stocks_create_post = async (req, res) => {
    const params = req.body;
    // { kind, datetime, quantity, price, commission, splitbefore, splitafter, dividend, notes } = req.body;
    const aid = req.params.aid;

    try {
        // data is valid
        let asset = await AssetStock.findById(aid);
        if (!asset) {
            throw Error('404');
        }

        console.log(chalk.cyan(JSON.stringify(asset, null, "  ")));
        console.log(chalk.cyan(JSON.stringify(params, null, "  ")));

        // validate data
        validateDate(params.datetime);
        validateBuyTransactionStock(params);
        validateSellTransactionStock(params);
        validateSplitTransactionStock(params);
        validateDividendTransactionStock(params);

        // todo
        if (kind == 'buy' || kind == 'sell') {
        }
        else if (kind == 'dividend') {
        }
        else if (kind == 'split') {
        }
        // const cost = (kind == 'buy' || kind == 'sell') ? cost = 

        // create transaction
        // let transaction = await TransactionStock.create({
        //     kind, datetime, quantity, price, commission,
        // });
        // updatePortfolioFromTransaction(asset, transaction);

        await asset
            .populate({path: 'transactions'})
            .populate({path: 'portfolio_id'})
            .populate({path: 'exchange_id'})
            .execPopulate();
        res.status(201).json({ asset });  // temp (should return transaction)
    }
    catch (err) {
        if (err.message === '404') {
           res.status(404).render('404', { title: 'Page Not Found', page: req.url });
        } else {
            const errors = handleErrors(err);
            res.status(400).json({ errors });
        }
    }
}