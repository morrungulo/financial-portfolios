"use strict";

const express = require('express');
const config = require('config');
const loaders = require('./loaders');

process.title = "financial-portfolios";

async function startServer() {
    const app = express();

    loaders.initialize({ expressApp: app })
        .then(() => {
            const port = config.get('server.port');
            const server = app.listen(port, err => {
                if (err) {
                    console.log(err);
                    return;
                }
                console.log(`Your server@${process.env.npm_package_version} is ready on port ${port}!`);
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
