const config = require('config');
const jwt = require('jsonwebtoken');
const User = require('../models/User');

/**
 * Handle errors on login / register.
 * 
 * @param {*} err 
 */
const handleErrors = (err) => {
    console.log(err.message, err.code);
    let errors = { email: '', password: '' };

    // incorrect email
    if (err.message === 'incorrect email') {
        errors.email = 'That email is not registered';
    }

    // incorrect password
    if (err.message === 'incorrect password') {
        errors.password = 'That password is incorrect';
    }

    // duplicate email error
    if (err.code === 11000) {
        errors.email = 'that email is already registered';
        return errors;
    }

    // validation errors
    if (err.message.includes('user validation failed')) {
        console.log(err);
        Object.values(err.errors).forEach(({ properties }) => {
            console.log(properties);
            errors[properties.path] = properties.message;
        });
    }

    return errors;
}

/**
 * 3 days in seconds
 */
const maxAge = 3 * 24 * 60 * 60;

/**
 * Create a jwt token.
 * 
 * @param {*} id the user id
 */
const createToken = (id) => {
    return jwt.sign({ id }, config.get('auth.secret'), {
        expiresIn: maxAge
    });
};

/**
 * GET register.
 * 
 * @param {*} req 
 * @param {*} res 
 */
module.exports.register_get = (req, res) => {
    res.render('register-login', { title: 'Register', buttonTitle: 'Sign Up', postPage: 'register' });
}

/**
 * POST register.
 * 
 * @param {*} req 
 * @param {*} res 
 */
module.exports.register_post = async (req, res) => {
    const { email, password } = req.body;
    try {
        const user = await User.create({ email, password });
        const token = createToken(user._id);
        res.cookie('jwt_fp', token, { httpOnly: true, maxAge: maxAge * 1000 });
        res.status(201).json({ user: user._id });
    }
    catch (err) {
        const errors = handleErrors(err);
        res.status(400).json({ errors });
    }
}

/**
 * GET login.
 * 
 * @param {*} req 
 * @param {*} res 
 */
module.exports.login_get = (req, res) => {
    res.render('register-login', { title: 'Login', buttonTitle: 'Login', postPage: 'login' });
}

/**
 * POST login.
 * 
 * @param {*} req 
 * @param {*} res 
 */
module.exports.login_post = async (req, res) => {
    const { email, password } = req.body;
    try {
        const user = await User.login(email, password);
        const token = createToken(user._id);
        res.cookie('jwt_fp', token, { httpOnly: true, maxAge: maxAge * 1000 });
        res.status(200).json({ user: user._id });
    }
    catch (err) {
        const errors = handleErrors(err);
        res.status(400).json({ errors });
    }
}

/**
 * GET logout.
 * 
 * @param {*} req 
 * @param {*} res 
 */
module.exports.logout_get = (req, res) => {
    res.cookie('jwt_fp', '', { maxAge: 1 });
    res.redirect('/');
}