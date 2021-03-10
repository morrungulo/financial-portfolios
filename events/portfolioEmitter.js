const EventEmitter = require('events');

// create emitter object
class PortfolioEmitter extends EventEmitter {}
const emitter = new PortfolioEmitter();

/**
 * Register for event 'update'
 */
emitter.on('update', (portfolio_id) => {
    // do nothing
});

/**
 * Handle errors
 */
emitter.on('error', (err) => {
    console.error('whoops! there was an error');
});

module.exports = emitter;