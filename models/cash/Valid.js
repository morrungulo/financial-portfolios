const mongoose = require('mongoose');

// the schema
const validForexSchema = new mongoose.Schema({

    // the currency code (eg. USD)
    code: {
        type: String,
        trim: true,
        uppercase: true,
        required: [true, "Enter the 'code' of the currency"],
        index: true,
    },

    // the currency name (eg. United States Dollar)
    name: {
        type: String,
        trim: true,
        required: [true, "Enter the 'name' of the currency"],
    },

}, { timestamps: true });

// the model
const ValidForex = mongoose.model('validforex', validForexSchema);

module.exports = ValidForex;