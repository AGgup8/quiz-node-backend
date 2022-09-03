const mongoose = require('mongoose');
const { Schema } = mongoose;

const questionSchema = new Schema({
    Text: {
        type: String,
        required: true,
        default: "new question"
    },
    pictureUrl: {
        type: String
    },
    options: [{
        type: String
    }],
    correctAnswer: {
        type: String,
        required: true,
        default: "correct answer"
    }
});

const Question = mongoose.model("Question", questionSchema);

module.exports = Question;