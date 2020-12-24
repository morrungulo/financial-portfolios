const express = require("express");
const morgan = require("morgan");
const cookieParser = require("cookie-parser");
const authMiddleware = require("../auth/authMiddleware");
const authRoutes = require("../auth/authRoutes");
const portfoliosRoutes = require("../portfolios/portfoliosRoutes");

module.exports = {
    initialize: ({ expressApp }, callback) => {
        
        // register view engine
        expressApp.set('view engine', 'ejs');

        // middleware & static files
        expressApp.use(express.static('public'));
        expressApp.use(express.json());
        expressApp.use(cookieParser());
        expressApp.use(morgan('dev'));

        // add path
        expressApp.use((req, res, next) => {
            res.locals.path = req.path;
            next();
        });    
        
        // set properties
        expressApp.set('trust proxy', true);

        // always check the user
        expressApp.get('*', authMiddleware.checkUser);

        // register home
        expressApp.get('/', (req, res) => res.render('home', { title: 'Home' }));

        // register about
        expressApp.get('/about', (req, res) => res.render('about', { title: 'About' }));

        // register routes
        expressApp.use('/auth', authRoutes);
        expressApp.use('/portfolios', portfoliosRoutes);

        // last page to be registered, the 404 page
        expressApp.use((req, res) => res.status(404).render('404', { title: 'Page Not Found', page: req.url }));

        // todo
        callback();
    }
};