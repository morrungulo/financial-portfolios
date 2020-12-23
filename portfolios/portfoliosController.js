const User = require("../models/Portfolio");
const config = require("config");

module.exports.portfolios_get = (req, res) => {

    
    res.render('home', { title: 'Home' });
}
