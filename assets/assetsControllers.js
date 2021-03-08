const config = require('config');
const chalk = require('chalk');
const AssetStock = require('../models/stock/Asset');
const AssetCrypto = require('../models/crypto/Asset');
const AssetCash = require('../models/cash/Asset');
const TransactionStock = require('../models/stock/Transaction');
const TransactionCrypto = require('../models/crypto/Transaction');
const TransactionCash = require('../models/cash/Transaction');

const TransactionStockEmitter = require('../events/transactionStockEmitter');
const TransactionCryptoEmitter = require('../events/transactionCryptoEmitter');
const TransactionCashEmitter = require('../events/transactionCashEmitter');

const { calculateAssetStockFromExchangeData } = require('./assetsStocksCalculator')
const { calculateAssetCashFromExchangeData, calculateAssetCryptoFromExchangeData } = require('./assetsCurrenciesCalculator');

const splitOnce = (s, on) => {
    [first, second, ...rest] = s.split(on)
    return [first, second, rest.length > 0 ? rest.join(on) : null]
}

const handleErrors = (err) => {
    console.log(chalk.magenta(err));
    console.log(chalk.red(err.message, err.code));
    let errors = { '404': '', assetstock: '', transactionstock: '' };

    if (err.message.startsWith("controller")) {
        const [ctrl, code, message] = splitOnce(err.message, ':');
        errors[code] = message;
    }

    if (err.message.startsWith("Cast to ObjectId failed")) {
        errors['404'] = message;
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

    // validation errors
    if (err.message.includes('assetcrypto validation failed')) {
        Object.values(err.errors).map(properties => {
            errors.assetcrypto = properties.message;
        });
    }

    // validation errors
    if (err.message.includes('transactioncrypto validation failed')) {
        Object.values(err.errors).map(properties => {
            errors.transactioncrypto = properties.message;
        });
    }

    // validation errors
    if (err.message.includes('assetcash validation failed')) {
        Object.values(err.errors).map(properties => {
            errors.assetcash = properties.message;
        });
    }

    // validation errors
    if (err.message.includes('transactioncash validation failed')) {
        Object.values(err.errors).map(properties => {
            errors.transactioncash = properties.message;
        });
    }

    return errors;
}

module.exports.assets_detail = async (req, res) => {
    const aid = req.params.aid;
    const assetMid = res.locals.asset;
    try {
        const asset = await assetMid.dbmodel.findById(aid)
            .populate({ path: 'transactions', options: { sort: { date: -1 } } })
            .populate({ path: 'portfolio_id' })
            .populate({ path: 'exchange_id' });
        res.render(`assets/${assetMid.url}-detail`, { title: asset.displayName, asset });
    }
    catch (err) {
        const errors = handleErrors(err);
        res.status(400).json({ errors });
    }
}

module.exports.assets_stocks_recalculate = async (req, res) => {
    const aid = req.params.aid;
    try {
        await calculateAssetStockFromExchangeData(aid);
        res.redirect('.');
    }
    catch (err) {
        const errors = handleErrors(err);
        res.status(400).json({ errors });
    }
}

module.exports.assets_cryptos_recalculate = async (req, res) => {
    const aid = req.params.aid;
    try {
        await calculateAssetCryptoFromExchangeData(aid);
        res.redirect('.');
    }
    catch (err) {
        const errors = handleErrors(err);
        res.status(400).json({ errors });
    }
}

module.exports.assets_cash_recalculate = async (req, res) => {
    const aid = req.params.aid;
    try {
        await calculateAssetCashFromExchangeData(aid);
        res.redirect('.');
    }
    catch (err) {
        const errors = handleErrors(err);
        res.status(400).json({ errors });
    }
}

const validateOnlyValidTransactionsStock = (obj) => {
    if (!(['buy', 'sell', 'split', 'units', 'dividend'].includes(obj.kind))) {
        throw Error('controller:kind:This type of transaction is not supported!');
    }
}

const validateBuyTransactionStock = (obj) => {
    if (obj.kind === 'buy') {
        if (parseFloat(obj.quantity) == 0) {
            throw Error("controller:quantity:This value cannot be zero");
        }
        // reset other values
        obj.dividend = 0
        obj.splitbefore = 1;
        obj.splitafter = 1;
    }
}

const validateSellTransactionStock = (obj) => {
    if (obj.kind === 'sell') {
        if (parseFloat(obj.quantity) == 0) {
            throw Error("controller:quantity:This value cannot be zero");
        }
        // change sign of quantity
        obj.quantity = -obj.quantity;
        // reset other values
        obj.dividend = 0
        obj.splitbefore = 1;
        obj.splitafter = 1;
    }
}

const validateDividendTransactionStock = (obj) => {
    if (obj.kind === 'dividend') {
        if (parseFloat(obj.dividend) == 0) {
            throw Error("controller:dividend:This value cannot be zero");
        }
        // reset other values
        obj.quantity = 0;
        obj.price = 0;
        obj.commission = 0;
        obj.splitbefore = 1;
        obj.splitafter = 1;
    }
}

const validateSplitTransactionStock = (obj) => {
    if (obj.kind === 'split') {
        if (parseInt(obj.splitbefore) < 1) {
            throw Error("controller:splitbefore:This value cannot be less than one");
        } else if (parseInt(obj.splitafter) < 1) {
            throw Error("controller:splitafter:This value cannot be less than one");
        }
        // reset other values
        obj.quantity = 0;
        obj.price = 0;
        obj.commission = 0;
        obj.dividend = 0;
    }
}

const validateUnitsTransactionStock = (obj) => {
    if (obj.kind === 'units') {
        if (parseFloat(obj.sadquantity) == 0) {
            throw Error("controller:sadquantity:This value cannot be zero");
        } else {
            obj.quantity = obj.sadquantity;
            obj.commission = obj.sadcommission;
        }
        // reset other values
        obj.dividend = 0
        obj.splitbefore = 1;
        obj.splitafter = 1;
    }
}

module.exports.transactions_stocks_create_post = async (req, res) => {
    const params = req.body;
    // { kind, date, quantity, price, commission, splitbefore, splitafter, dividend, notes }
    const aid = req.params.aid;

    try {
        // data is valid
        let asset = await AssetStock.findById(aid).lean();
        if (!asset) {
            throw Error('404');
        }

        // validate data
        validateOnlyValidTransactionsStock(params);
        validateBuyTransactionStock(params);
        validateSellTransactionStock(params);
        validateSplitTransactionStock(params);
        validateDividendTransactionStock(params);
        validateUnitsTransactionStock(params);

        // create transaction
        let transaction = await TransactionStock.create({
            kind: params.kind,
            date: params.date,
            quantity: params.quantity,
            price: params.price,
            commission: params.commission,
            dividend: params.dividend,
            split_before: params.splitbefore,
            split_after: params.splitafter,
            notes: params.notes,
            asset_id: asset._id,
        });
        TransactionStockEmitter.emit('create', transaction);
        res.status(201).json({ transaction });
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

module.exports.transactions_stocks_remove_post = async (req, res) => {
    const { id } = req.body;
    const aid = req.params.aid;
    try {
        const transaction = await TransactionStock.findByIdAndDelete(id);
        TransactionStockEmitter.emit('delete', transaction);
        res.status(201).json({});
    } catch (err) {
        const errors = handleErrors(err);
        res.status(400).json({ errors });
    }
}


const validateOnlyValidTransactionsCrypto = (obj) => {
    if (!(['buy', 'sell', 'split', 'units'].includes(obj.kind))) {
        throw Error('controller:kind:This type of transaction is not supported!');
    }
}

const validateBuyTransactionCrypto = (obj) => {
    if (obj.kind === 'buy') {
        if (parseFloat(obj.quantity) == 0) {
            throw Error("controller:quantity:This value cannot be zero");
        }
        // reset other values
        obj.splitbefore = 1;
        obj.splitafter = 1;
    }
}

const validateSellTransactionCrypto = (obj) => {
    if (obj.kind === 'sell') {
        if (parseFloat(obj.quantity) == 0) {
            throw Error("controller:quantity:This value cannot be zero");
        }
        // change sign of quantity
        obj.quantity = -obj.quantity;
        // reset other values
        obj.splitbefore = 1;
        obj.splitafter = 1;
    }
}

const validateSplitTransactionCrypto = (obj) => {
    if (obj.kind === 'split') {
        if (parseInt(obj.splitbefore) < 1) {
            throw Error("controller:splitbefore:This value cannot be less than one");
        } else if (parseInt(obj.splitafter) < 1) {
            throw Error("controller:splitafter:This value cannot be less than one");
        }
        // reset other values
        obj.quantity = 0;
        obj.price = 0;
        obj.commission = 0;
    }
}

const validateUnitsTransactionCrypto = (obj) => {
    if (obj.kind === 'units') {
        if (parseFloat(obj.sadquantity) == 0) {
            throw Error("controller:sadquantity:This value cannot be zero");
        } else {
            obj.quantity = obj.sadquantity;
            obj.commission = obj.sadcommission;
        }
        // reset other values
        obj.price = 0;
        obj.splitbefore = 1;
        obj.splitafter = 1;
    }
}

module.exports.transactions_cryptos_create_post = async (req, res) => {
    const params = req.body;
    // { kind, date, quantity, price, commission, splitbefore, splitafter, dividend, notes }
    const aid = req.params.aid;

    try {
        // data is valid
        let asset = await AssetCrypto.findById(aid).lean();
        if (!asset) {
            throw Error('404');
        }

        // validate data
        validateOnlyValidTransactionsCrypto(params);
        validateBuyTransactionCrypto(params);
        validateSellTransactionCrypto(params);
        validateSplitTransactionCrypto(params);
        validateUnitsTransactionCrypto(params);

        // create transaction
        let transaction = await TransactionCrypto.create({
            kind: params.kind,
            date: params.date,
            quantity: params.quantity,
            price: params.price,
            commission: params.commission,
            split_before: params.splitbefore,
            split_after: params.splitafter,
            notes: params.notes,
            asset_id: asset._id,
        });
        TransactionCryptoEmitter.emit('create', transaction);
        res.status(201).json({ transaction });
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

module.exports.transactions_cryptos_remove_post = async (req, res) => {
    const { id } = req.body;
    const aid = req.params.aid;
    try {
        const transaction = await TransactionCrypto.findByIdAndDelete(id);
        TransactionCryptoEmitter.emit('delete', transaction);
        res.status(201).json({});
    } catch (err) {
        const errors = handleErrors(err);
        res.status(400).json({ errors });
    }
}