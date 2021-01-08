const config = require('config');
const chalk = require('chalk');
const ExchangeStock = require('../models/stock/Exchange');

const handleErrors = (err) => {
    console.log(chalk.red(err.message, err.code));
    let errors = { exchangestock: '' };

    // validation errors
    if (err.message.includes('exchangestock validation failed')) {
        Object.values(err.errors).map(properties => {
            errors[properties.path] = properties.message;
        });
    }

    return errors;
}

module.exports.exchanges_detail = async (req, res) => {
    const eid = req.params.eid;
    try {
        const entry = await ExchangeStock.findById(eid);
        res.render('exchanges-detail', { title: entry.name, entry });
    }
    catch (err) {
        const errors = handleErrors(err);
        res.status(400).json({ errors });
    }
}