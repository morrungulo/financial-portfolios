const expressLoader = require('./express');
const mongooseLoader = require('./mongoose');
const schedulerLoader = require('./scheduler')

module.exports = {
    initialize: ({ expressApp }, callback) => {

        mongooseLoader.initialize(() => {
            console.log("Loading mongoose...");
        });
        expressLoader.initialize({ expressApp }, () => {
            console.log("Loading express...");
        });
        schedulerLoader.initialize(() => {
            console.log("Scheduling jobs...");
        });

        callback();
    }
};