const mongoose = require('mongoose');

// the schema
const exchangeForexSchema = new mongoose.Schema({
    from: {
        type: String,
        trim: true,
        uppercase: true,
        required: [true, 'Please enter a \'from\' currency']
    },
    to: {
        type: String,
        trim: true,
        uppercase: true,
        required: [true, 'Please enter a \'to\' currency']
    },
    rate: {
        type: Number,
        required: [true, 'Please enter a \'conversion rate\' for this currency']
    }
}, { timestamps: true});

// the model
const ExchangeForex = mongoose.model('exchangeforex', exchangeForexSchema);

module.exports = ExchangeForex;