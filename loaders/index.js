const expressLoader = require('./express');
// const migrate = require('./migrate');
const mongooseLoader = require('./mongoose');
const schedulerLoader = require('./scheduler')
module.exports = {
    initialize: async ({ expressApp }) => {
        await Promise.all([
            mongooseLoader.initialize(),
            expressLoader.initialize(expressApp),
        ]);
        await Promise.all([
            schedulerLoader.initialize(),
        ]);
        console.log('Initialization complete!');
    }
};