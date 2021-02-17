const mongoose = require('mongoose');

// the schema
const watchlistSchema = new mongoose.Schema({

    // watchlist name
    name: {
        type: String,
        trim: true,
        required: [true, 'Please enter a watchlist name']
    },

    // who owns it
    user_id: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'user',
        required: true,
        index: true,
    },

    // the list of cash assets
    cash_entries: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'exchangeforex'        
    }],

    // the list of crypto assets
    crypto_entries: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'exchangecrypto'        
    }],

    // the list of stock assets
    stock_entries: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'exchangestock'
    }]

});

const Watchlist = mongoose.model('watchlist', watchlistSchema);

module.exports = Watchlist;