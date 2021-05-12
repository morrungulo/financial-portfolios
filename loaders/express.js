const express = require('express');
const morgan = require('morgan');
const cookieParser = require('cookie-parser');
const chalk = require('chalk');
const helmet = require('helmet');
const compression = require('compression');
const authMiddleware = require('../auth/authMiddleware');
const authRoutes = require('../auth/authRoutes');
const showRoutes = require('../show/showRoutes');
const portfoliosRoutes = require('../portfolios/portfoliosRoutes');
const watchlistsRoutes = require('../watchlists/watchlistsRoutes');
const exchangesRoutes = require('../exchanges/exchangesRoutes');
const assetsRoutes = require('../assets/assetsRoutes');

module.exports = {
    initialize: async (expressApp) => {

        // register view engine
        expressApp.set('view engine', 'ejs');

        // middleware & static files
        expressApp.use(express.static('public'));
        expressApp.use(express.json());
        expressApp.use(cookieParser());
        expressApp.use(morgan('dev'));
        expressApp.use(compression());

        // helmet
        expressApp.use(helmet({
            contentSecurityPolicy: {
                useDefaults: true,
                directives: {
                    "script-src": [
                        "'self'",
                        "'unsafe-inline'",
                        "https://ajax.googleapis.com/ajax/libs/jquery/3.5.1/jquery.min.js",
                        "https://www.kryogenix.org/code/browser/sorttable/sorttable.js",
                        "https://cdn.jsdelivr.net/npm/apexcharts",
                    ],
                    "script-src-attr": [
                        "'self'",
                        "'unsafe-inline'"
                    ]
                }
            },
        }));

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
        expressApp.use('/show', showRoutes);
        expressApp.use('/portfolios', portfoliosRoutes);
        expressApp.use('/watchlists', watchlistsRoutes);
        expressApp.use('/exchanges', exchangesRoutes)
        expressApp.use('/assets', assetsRoutes);

        // the 404 page
        expressApp.use((req, res) => res.status(404).render('404', { title: 'Page Not Found', page: req.url }));

        // the error middleware
        expressApp.use((error, req, res, next) => {
            console.error(chalk.yellow(error))
            const status = error.status || 500
            const message = error.message
            res.status(status).json({
                errors: {
                    default: message
                }
            })
        })

        // complete
        console.log('Express loaded!');
    }
};