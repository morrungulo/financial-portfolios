const mongoose = require('mongoose');

// the schema
const validCryptoSchema = new mongoose.Schema({

    // the crypto code (eg. BTC)
    code: {
        type: String,
        trim: true,
        uppercase: true,
        required: [true, "Enter the 'code' of the digital currency"],
        index: true,
    },

    // the crypto name (eg. Bitcoin)
    name: {
        type: String,
        trim: true,
        required: [true, "Enter the 'name' of the digital currency"],
    },

}, { timestamps: true });

// the model
const ValidCrypto = mongoose.model('validcrypto', validCryptoSchema);

module.exports = ValidCrypto;