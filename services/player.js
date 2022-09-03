const Player = require('../models/player');

const playerService = {
    find: () => Player.find({}),

    findByName: async (name) => {
        const players = await Player.find({ name });
        return players;
    },

    findById: (id) => Player.findById(id),

    save: async (postData) => {
        const player = new Player({ ...postData });
        await player.save();
        return player;
    },

    deleteById: (id) => Player.findOneAndDelete({_id: id}),

    deleteAll: () => Player.deleteMany({})

};

module.exports = playerService;
