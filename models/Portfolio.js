const mongoose = require('mongoose');
const assetSchema = require('./Asset');

function twoDecimalPoints(num) {
    return num.toFixed(2);
}

// the schema
const portfolioSchema = new mongoose.Schema({
    portfolio: {
        type: String,
        trim: true,
        required: [true, 'Please enter a name']
    },
    user: {
        type: String,
        required: true
    },
    assets: [assetSchema],
    unrealized_value: {
        type: Number,
        get: twoDecimalPoints,
        default: 0
    },
    unrealized_value_percentage: {
        type: Number,
        get: twoDecimalPoints,
        default: 0
    },

    realized_value: {
        type: Number,
        get: twoDecimalPoints,
        default: 0
    },
    cost_basis: {
        type: Number,
        get: twoDecimalPoints,
        default: 0
    },

    // unrealized_value - cost-basis
    total_value: {
        type: Number,
        get: twoDecimalPoints,
        default: 0
    },

    // (unrealized_value / cost_basis - 1) * 100
    total_value_percentage: {
        type: Number,
        get: twoDecimalPoints,
        default: 0
    },
    
    annualized_value: {
        type: Number,
        get: twoDecimalPoints,
        default: 0
    },
    
    daily_value: {
        type: Number,
        get: twoDecimalPoints,
        default: 0
    },
    daily_value_percentage: {
        type: Number,
        get: twoDecimalPoints,
        default: 0
    },
});

const Portfolio = mongoose.model('portfolio', portfolioSchema);

module.exports = Portfolio;