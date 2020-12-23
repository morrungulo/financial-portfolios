const mongoose = require("mongoose");

module.exports = {
    initialize: (callback) => {

        // database connection
        // const dbURI = 'mongodb+srv://morrungulo:EvnrCV76.MB@cluster0.yasie.mongodb.net/financial-portfolios';
        const dbURI = 'mongodb://mongodb:27017/test';
        // const dbURI = 'mongodb://127.0.0.1:27017/test';
        mongoose.connect(dbURI, { useNewUrlParser: true, useUnifiedTopology: true, useCreateIndex:true })
            .then((result) => callback())
            .catch((err) => console.log(err));
    }
}