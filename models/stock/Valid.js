const mongoose = require('mongoose');

// the schema
const validStockSchema = new mongoose.Schema({

    // the stock code (eg. MSFT)
    code: {
        type: String,
        trim: true,
        uppercase: true,
        required: [true, "Enter the 'code' of the stock"],
        index: true,
    },

    // the stock name (eg. Microsoft)
    name: {
        type: String,
        trim: true,
    },

}, { timestamps: true });

// the model
const ValidStock = mongoose.model('validstock', validStockSchema);

module.exports = ValidStock;