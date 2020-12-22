const mongoose = require("mongoose");

module.exports = {
    initialize: (callback) => {

        // database connection
        // const dbURI = 'mongodb+srv://shaun:test1234@cluster0.del96.mongodb.net/node-auth';
        const dbURI = 'mongodb+srv://morrungulo:EvnrCV76.MB@cluster0.yasie.mongodb.net/financial-portfolios';
        mongoose.connect(dbURI, { useNewUrlParser: true, useUnifiedTopology: true, useCreateIndex:true })
            .then((result) => callback())
            .catch((err) => console.log(err));
    }
}