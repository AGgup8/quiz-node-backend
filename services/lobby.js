const Lobby = require('../models/lobby');

const lobbyService = {
    find: async () => Lobby.find({}),

    findByName: async (name) => Lobby.find({ name }),

    findById: async (id) => Lobby.findById(id),

    save: async (postData) => {
        const lobby = new Lobby({ ...postData });
        await lobby.save();
        return lobby;
    },

    deleteById: async (id) => Lobby.findOneAndDelete({ _id: id }),
};

module.exports = lobbyService;
