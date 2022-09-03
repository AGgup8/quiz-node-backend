const questionService = require('../services/question');

const questionController = {
    // GET /api/questions
    find: async (req, res, next) => {
        try {
            const questions = await questionService.find({ ...req.query });
            res.json(questions);
        } catch (error) {
            error.msg = "failed to retrieve questions";
            next(error);
        }
    },

    // GET /api/questions/:id
    findById: async (req, res, next) => {
        try {
            const question = await questionService.findById(req.params.id);
            res.json(question);
        } catch (error) {
            error.msg = "failed to retrieve question by ID";
            next(error);
        }
    },

    // POST /api/questions
    save: async (req, res, next) => {
        try {
            const question = await questionService.save(req.body);
            res.status(201).json(question);
        } catch (error) {
            error.msg = "failed to create question";
            next(error);
        }
    },

    // DELETE /api/questions/:id
    deleteById: async (req, res, next) => {
        try {
            const question = await questionService.deleteById(req.params.id);
            return res.json(question);
        } catch (error) {
            error.msg = "failed to delete question by ID";
            next(error);
        }
    },

    // DELETE /api/questions
    deleteAll: async (req, res, next) => {
        try {
            const numDeleted = await questionService.deleteAll();
            return res.json(numDeleted);
        } catch (error) {
            error.msg = "failed to delete question by ID";
            next(error);
        }
    }
};

module.exports = questionController;