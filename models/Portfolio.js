const mongoose = require('mongoose');

// the schema
const portfolioSchema = new mongoose.Schema({
    name: {
        type: String,
        required: [true, 'Please enter a name']
    },
    user_id: {
        type: String,
        required: true
    },
    unrealized_gains: {
        
    },
    realized_gains: {

    },
    annualized_gains: {

    },
    daily_changes: {

    },
    total_changes: {

    }
});

const Portfolio = mongoose.model('portfolio', portfolioSchema);

module.exports = Portfolio;