const Question = require('../models/question');

const questionService = {
    find: () => Question.find({}),

    findById: (id) => Question.findById(id),

    save: async (postData) => {
        const question = new Question({ ...postData });
        await question.save();
        return question;
    },

    deleteById: (id) => Question.findOneAndDelete({_id: id}),

    deleteAll: () => Question.deleteMany({})

};

module.exports = questionService;
