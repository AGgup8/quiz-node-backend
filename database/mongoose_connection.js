const mongoose = require('mongoose');

async function mongooseConnect() {
    mongoose.connect(
        "mongodb+srv://quiz:hHsDdxp7mo9YzH@simple-quiz-cluster.qeqh7qw.mongodb.net/simpleQuiz?retryWrites=true&w=majority",
        { useNewUrlParser: true, useUnifiedTopology: true }
    )
    .catch((e) => console.log(e));

    const db = mongoose.connection;

    db.on('connected', () => {
        console.log('Mongoose connection open');
    });

    db.on('error', error => {
        console.log(`Mongoose connection error: ${error}`);
    });

    db.on('disconnected', () => {
        console.log('Mongoose connection disconnected');
    });

    return db;
}

module.exports = mongooseConnect;
