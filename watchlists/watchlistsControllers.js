const config = require('config');
const chalk = require('chalk');
const Watchlist = require('../models/Watchlist');

const handleErrors = (err) => {
    console.log(err.message, err.code);
    let errors = { watchlist: '' };

    // validation errors
    if (err.message.includes('watchlist validation failed')) {
        Object.values(err.errors).forEach(({ properties }) => {
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
        console.log(watchlist);
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
    res.send("Not implemented - watchlists_detail!");
}

module.exports.watchlists_entry_create_get = async (req, res) => {
    res.send("Not implemented - watchlists_entry_create_get!");
}

module.exports.watchlists_entry_create_post = async (req, res) => {
    res.send("Not implemented - watchlists_entry_create_post!");
}

module.exports.watchlists_entry_remove_post = async (req, res) => {
    res.send("Not implemented - watchlists_entry_remove_post!");
}

module.exports.watchlists_entry_detail = async (req, res) => {
    res.send("Not implemented - watchlists_entry_detail!");
}
