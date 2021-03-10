const ExchangeStock = require('../models/stock/Exchange');
const ExchangeCrypto = require('../models/crypto/Exchange');
const ExchangeForex = require('../models/cash/Exchange');

const handleErrors = (err) => {
    console.log(chalk.red(err.message, err.code));
    const errors = { exchangestock: '', exchangecrypto: '', exchangeforex: '' };

    // validation errors
    if (err.message.includes('exchangestock validation failed')) {
        Object.values(err.errors).map(properties => {
            errors[properties.path] = properties.message;
        });
    }

    // validation errors
    if (err.message.includes('exchangecrypto validation failed')) {
        Object.values(err.errors).map(properties => {
            errors[properties.path] = properties.message;
        });
    }

    // validation errors
    if (err.message.includes('exchangeforex validation failed')) {
        Object.values(err.errors).map(properties => {
            errors[properties.path] = properties.message;
        });
    }

    return errors;
}

module.exports.exchanges_detail = async (req, res) => {
    const eid = req.params.eid;
    const exMid = res.locals.exchange;
    try {
        const entry = await exMid.dbmodel.findById(eid);
        res.render(`exchanges/${exMid.url}/exchanges-detail`, { title: entry.name, entry });
    }
    catch (err) {
        const errors = handleErrors(err);
        res.status(400).json({ errors });
    }
}
