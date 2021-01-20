const config = require('config');
const chalk = require('chalk');
const AssetStock = require('../models/stock/Asset');
const TransactionStock = require('../models/stock/Transaction');

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

    return errors;
}

module.exports.assets_stocks_detail = async (req, res) => {
    const aid = req.params.aid;
    try {
        let asset = await AssetStock.findById(aid);
        await asset
            .populate({ path: 'transactions', options: { sort: { date: -1 } } })
            .populate({ path: 'portfolio_id' })
            .populate({ path: 'exchange_id' })
            .execPopulate();
        res.render('assets/stocks-detail', { title: asset.exchange_id.name, asset });
    }
    catch (err) {
        const errors = handleErrors(err);
        res.status(400).json({ errors });
    }
}

const validateBuyTransactionStock = (obj) => {
    return validateSellTransactionStock(obj);
}

const validateSellTransactionStock = (obj) => {
    if (['buy', 'sell'].includes(obj.kind)) {
        if (parseFloat(obj.quantity) == 0) {
            throw Error("controller:quantity:This value cannot be zero");
        }
        // reset other values
        obj.dividend = 0
        obj.splitbefore = 1;
        obj.splitafter = 1;
    }
}

const validateDividendTransactionStock = (obj) => {
    if (obj.kind == 'dividend') {
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
    if (obj.kind == 'split') {
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

module.exports.transactions_stocks_create_post = async (req, res) => {
    const params = req.body;
    // { kind, date, quantity, price, commission, splitbefore, splitafter, dividend, notes }
    const aid = req.params.aid;

    try {
        // data is valid
        let asset = await AssetStock.findById(aid);
        if (!asset) {
            throw Error('404');
        }

        // validate data
        validateBuyTransactionStock(params);
        validateSellTransactionStock(params);
        validateSplitTransactionStock(params);
        validateDividendTransactionStock(params);

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
        });

        // push and save
        asset.transactions.push(transaction._id);
        asset.save(err => {
            if (err) {
                const errors = handleErrors(err);
                res.status(400).json({ errors });
            } else {
                res.status(201).json({ transaction });
            }
        });
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
    AssetStock.findByIdAndUpdate(aid, {$pull: {transactions: id}}, (err, data) => {
        if (err) {
            const errors = handleErrors(err);
            res.status(400).json({ errors });
        } else {
            res.status(201).json({});
        }
    });
}