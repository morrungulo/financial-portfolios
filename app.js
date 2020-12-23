const express = require('express');
const config = require('config');

const loaders = require('./loaders');

process.title = "financial-portfolios";

async function startServer() {
    const app = express();

    loaders.initialize({ expressApp: app }, () => {
        console.log("Finished loading!");
    });

    var server = app.listen(config.get("server.port"), err => {
        if (err) {
            console.log(err);
            return;
        }
        console.log('Your server is ready!');
    });

    process.on('SIGTERM', () => {
        server.close(() => {
            console.log("Shutdown the server!");
        })
    });
}

startServer();
