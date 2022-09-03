const mongoose = require('mongoose');
const { Schema } = mongoose;

const lobbySchema = new Schema({
    name: {
        type: String
    },
    question: {
        text: {
            type: String
        },
        pictureUrl: {
            type: String
        },
        options: [{
            type: String
        }],
        correctAnswer: {
            type: String
        }
    },
    players: [{
        name: {
            type: String,
            required: true
        },
        answer: {
            type: String
        },
        speed: {
            type: Number
        },
        score: {
            type: Number,
            required: true,
            default: 0
        },
        correct: {
            type: Boolean,
            default: false
        }
    }],
    hasQuestionStarted: {
        type: Boolean,
        default: false
    },
    hasQuestionEnded: {
        type: Boolean,
        default: false
    },
    isShowingAnswer: {
        type: Boolean,
        default: false
    }
});

const Lobby = mongoose.model("Lobby", lobbySchema);

module.exports = Lobby;