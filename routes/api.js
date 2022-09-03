const express = require('express');
const router = express.Router();
const fs = require("fs");

// const questionController = require('../controllers/question');
const lobbyService = require("../services/lobby");


// router.get('/questions', questionController.find);

// router.get('/questions/:id', questionController.findById);

// router.patch('/questions/:id', questionController.save);

// router.delete('/questions/:id', questionController.deleteById);

// router.delete('/questions', questionController.deleteAll);

router.get('/lobbys', async (req, res, next) => {
    try {
        if (req.query.name !== null) {
            const lobbys = await lobbyService.findByName(req.query.name);
            res.json(lobbys);
        } else {
            const lobbys = await lobbyService.find();
            res.json(lobbys);
        }

    } catch (error) {
        error.msg = "failed to retrieve all lobbies";
        next(error);
    }
});

router.post('/lobbys', async (req, res, next) => {
    try {
        const lobby = await lobbyService.save(req.body);
        res.status(201).json(lobby);
    } catch (error) {
        error.msg = "failed to create new lobbies";
        next(error);
    }
});

router.get('/lobbys/:id', async (req, res, next) => {
    try {
        const lobby = await lobbyService.findById(req.params.id);
        res.json(lobby);
    } catch (error) {
        error.msg = "failed to find new lobby by id";
        next(error);
    }
});


module.exports = router;
