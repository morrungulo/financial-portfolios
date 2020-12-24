const config = require("config");
// const User = require("../models/Portfolio");

module.exports.portfolios_get = (req, res) => {
    res.render('home', { title: 'Home' });
}
