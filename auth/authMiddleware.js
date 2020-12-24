const config = require('config');
const jwt = require('jsonwebtoken');
const User = require('../models/User');


/**
 * Middleware which checks if a json web token exists, and if yes, verifies it.
 * 
 * @param {*} req 
 * @param {*} res 
 * @param {*} next 
 */
const requireAuth = (req, res, next) => {
    const token = req.cookies.jwt_fp;
    if (token) {
        jwt.verify(token, config.get('auth.secret'), (err, decodedToken) => {
            if (err) {
                console.log(err.message);
                res.redirect('/auth/login');
            } else {
                console.log(decodedToken);
                next();
            }
        });
    } else {
        res.redirect('/auth/login');
    }
};


/**
 * Middleware which extracts the user from the jwt token and verify its existance.
 * If yes, then set the user in res.locals.user.
 * 
 * @param {*} req 
 * @param {*} res 
 * @param {*} next 
 */
const checkUser = (req, res, next) => {
    const token = req.cookies.jwt_fp;
    if (token) {
        jwt.verify(token, config.get('auth.secret'), async (err, decodedToken) => {
            if (err) {
                res.locals.user = null;
                next();
            } else {
                let user = await User.findById(decodedToken.id);
                res.locals.user = user;
                next();
            }
        });
    } else {
        res.locals.user = null;
        next();
    }
};


module.exports = { requireAuth, checkUser };