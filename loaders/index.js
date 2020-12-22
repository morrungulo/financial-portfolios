const expressLoader = require("./express");
const mongooseLoader = require("./mongoose");

module.exports = {
    initialize: ({ expressApp }, callback) => {

        mongooseLoader.initialize(() => {
            console.log("Loading mongoose...");
        });
        expressLoader.initialize({ expressApp }, () => {
            console.log("Loading express...");
        });

        callback();
    }
};