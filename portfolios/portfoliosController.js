const config = require("config");
const Portfolio = require("../models/Portfolio");

const handleErrors = (err) => {
    console.log("dbg 1a:", err.message);
    console.log("dbg 1b:", err.code);
    let errors = { portfolio: '' };

    // validation errors
    if (err.message.includes('portfolio validation failed')) {
        console.log("dbg 1c", err);
        Object.values(err.errors).forEach(({ properties }) => {
            console.log("dbg 1d:", properties);
            errors[properties.path] = properties.message;
        });
    }

    return errors;
}

module.exports.portfolios_get = async (req, res) => {
    const user = res.locals.user._id;
    try {
        let portfolios = await Portfolio.find({ user })
            .sort({portfolio: 1});
        res.locals.portfolios = portfolios;
    }
    catch (err) {
        const errors = handleErrors(err);
        //todo
    }
    res.render('portfolios', {title: "Portfolios"});
}

module.exports.portfolios_create_get = (req, res) => {
    res.render('portfolios-create', { title: 'Create Portfolio' });
}

module.exports.portfolios_create_post = async (req, res) => {
    const { portfolio } = req.body;
    const user = res.locals.user._id;
    try {
        await Portfolio.create({ portfolio, user });
        res.status(201).json({ portfolio });
    }
    catch (err) {
        const errors = handleErrors(err);
        res.status(400).json({ errors });
    }
}

module.exports.portfolios_id_get = async (req, res) => {
    const portfolio_id = req.params.pid;
    let title = "";
    try {
        let portfolio = await Portfolio.findById(portfolio_id);
        res.locals.portfolio = portfolio;
        res.locals.assets = portfolio.assets;
        title = portfolio.portfolio;
    }
    catch (err) {
        const errors = handleErrors(err);
        //todo
    }
    res.render('portfolios-assets', {title});
}


module.exports.portfolios_id_create_get = (req, res) => {
    res.send('NOT IMPLEMENTED: portfolios_id_create_get');
}

module.exports.portfolios_id_create_post = (req, res) => {
    res.send('NOT IMPLEMENTED: portfolios_id_create_post');
}

module.exports.portfolios_id_asset_id_get = (req, res) => {
    res.send('NOT IMPLEMENTED: portfolios_id_asset_id_get');
}
