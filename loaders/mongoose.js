const config = require('config');
const mongoose = require('mongoose');
module.exports = {
    initialize: async () => {
        // mongodb atlas
        // const dbURI = 'mongodb+srv://morrungulo:EvnrCV76.MB@cluster0.yasie.mongodb.net/financial-portfolios';
        
        // mongodb docker-compose
        // const dbURI = 'mongodb://mongodb:27017/' + config.get('mongodb.dbname');
        
        // mongodb standalone docker (docker run -p 27017:27017 --name mongodb -v data:/data/db --rm -d mongo --bind_ip 0.0.0.0)
        // run mongo inside the container (docker exec -it mongodb /bin/bash)
        const dbURI = 'mongodb://172.17.0.2:27017/test';
        
        // database connection
        try {
            await mongoose.connect(dbURI, { useNewUrlParser: true, useUnifiedTopology: true, useFindAndModify: false, useCreateIndex:true, socketTimeoutMS:15000 })
            console.log('Mongoose loaded!')
        } catch (err) {
            console.log(err);
        }
    }
}