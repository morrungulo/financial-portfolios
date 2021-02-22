"use strict";

const express = require('express');
const config = require('config');
const loaders = require('./loaders');

process.title = "financial-portfolios";

async function startServer() {
    const app = express();

    loaders.initialize({ expressApp: app })
        .then(() => {
            const server = app.listen(config.get('server.port'), err => {
                if (err) {
                    console.log(err);
                    return;
                }
                console.log('Your server is ready on port ' + config.get('server.port') + '!');
            });
            
            process.on('SIGTERM', () => {
                server.close(() => {
                    console.log("Shutdown the server!");
                })
            });
        })
        .catch((err) => {
            console.log('Could not start application: ' + err);
        });
}

startServer();
