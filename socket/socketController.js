const Lobby = require('../models/lobby');

const io = require("socket.io")();
const socketapi = { io };

const fs = require("fs");

// instantiate change streams
const changeStreams = (io) => {
  const changeStream = Lobby.watch([
    {
      "$match": {
        "operationType": "update"
      }
    }
  ], { "fullDocument": "updateLookup" });
  changeStream.on("change", (next) => {
    io.in(next.fullDocument._id.toHexString()).emit("updated-lobby", next.fullDocument);
  });
};
changeStreams(io);

io.on("connection", (socket) => {
  console.log("A user connected:" + socket.id);

  socket.on("create-lobby", async (name) => {
    name = name.trim()
    try {
      const lobby = await Lobby.findOne({ "name": name });
      if (lobby) {
        const id = lobby._id.toHexString();
        socket.join(id);
        socket.activeLobby = id;
        socket.emit("message", "joined existing lobby");
        socket.emit("joined-lobby", lobby);
      } else {
        const newLobby = new Lobby({ "name": name });
        newLobby.save((err, data) => {
          if (err) {
            console.log(err);
          } else {
            const id = data._id.toHexString()
            socket.join(id);
            socket.activeLobby = id;
            socket.emit("message", "created new lobby");
            socket.emit("joined-lobby", data);
          }
        });
      }
    } catch (err) {
      console.log(err);
    }
  });

  socket.on("join-lobby", async (lobbyName, playerName) => {  
    lobbyName = lobbyName.trim();
    playerName = playerName.trim();
    try {
      const lobby = await Lobby.findOne({ name: lobbyName });
      if (lobby) { // lobby has been found
        const lobbyId = lobby._id.toHexString();
        const existingPlayer = await Lobby.findOne({ "_id": lobbyId, "players.name": playerName })
        if (existingPlayer) { // player with the same name has already joined
          socket.emit("message", "name is taken");
        } else {
          socket.join(lobbyId);
          socket.activeLobby = lobbyId;
          const newLobby = await Lobby.findOneAndUpdate( // to find the new player's id
            { _id: lobbyId },
            { $push: { "players": { name: playerName } } },
            { new: true }
          );
          const newPlayer = newLobby.players.find((player) => (player.name == playerName));
          socket.activePlayer = newPlayer._id.toHexString();
          socket.emit("player-joined", newPlayer);
        }
      } else {
        socket.emit("message", "quiz not found");
      }
    } catch (err) {
      console.log(err);
    }
  });

  socket.on("rejoin", async (id) => {
    const lobby = await Lobby.findOne({ "players._id": id });
    if (lobby) {
      socket.activeLobby = lobby._id.toHexString();
      socket.activePlayer = id;
      socket.join(lobby._id.toHexString());
      const player = lobby.players.find((player) => (player._id.toHexString() == id));
      socket.emit("rejoined", lobby, player);
    }
  })

  socket.on("remove-player", async (id) => {
    try {
      await Lobby.findOneAndUpdate(
        {},
        { $pull: { "players": { "_id": id } } },
        { new: true }
      );
      socket.emit("message", "removed player");
    } catch (err) {
      console.log(err);
    }
  })

  socket.on("show-question", async ({ question="", answer="", imageData, imageName, options }) => {
    answer = answer.trim();
    question = question.trim();
    try {
      const lobbyId = socket.activeLobby;

      // check if the last question had an image and remove
      const existingLobby = await Lobby.findOne({ "_id": lobbyId });
      if (existingLobby.question.pictureUrl && fs.existsSync(`public/images/${existingLobby.question.pictureUrl}`)) {
        fs.unlink(`public/images/${existingLobby.question.pictureUrl}`, (err) => {
          if (err) throw err;
        });
      }

      // add new image
      if (imageData) {
        const splitted = imageData.split(';base64,');
        // const format = splitted[0].split('/')[1];
        fs.writeFileSync(`public/images/${imageName}`, splitted[1], { encoding: 'base64' });
      }
      await Lobby.findOneAndUpdate(
        { "_id": lobbyId },
        {
          $set:
          {
            "question": { "text": question, "correctAnswer": answer, "pictureUrl": imageName, "options": options },
            "hasQuestionStarted": true,
            "hasQuestionEnded": false,
            "isShowingAnswer": false,
            "players.$[].correct": false,
            "players.$[].answer": null,
            "players.$[].speed": null
          }
        },
        { new: true }
      );
    } catch (err) {
      console.log(err);
    }
  })

  socket.on("end-question", async () => {
    try {
      const lobbyId = socket.activeLobby;
      const newLobby = await Lobby.findOneAndUpdate(
        { "_id": lobbyId },
        {
          $set:
          {
            "hasQuestionStarted": true,
            "hasQuestionEnded": true,
            "isShowingAnswer": false
          }
        },
        { new: true }
      );
    } catch (err) {
      console.log(err);
    }
  })

  socket.on("show-answer", async () => {
    try {
      const lobbyId = socket.activeLobby;
      const lobby = await Lobby.findOneAndUpdate(
        { "_id": lobbyId },
        {
          $set: {
            "hasQuestionStarted": true,
            "hasQuestionEnded": true,
            "isShowingAnswer": true,
          }
        },
        {
          new: true
        }
      );

      const answer = lobby.question.correctAnswer;
      const regex = new RegExp("^" + answer.replace(/\s+/g, '') + "$", "i");
      const updatedPlayers = lobby.players.map((player) => {
        if (player.answer.replace(/\s+/g, '').match(regex) && !player.correct) {
          player.correct = true;
          const answerValue = 100 + ((10000 - player.speed ** 1.01) / 100);
          player.score = player.score + answerValue;
        }
        return player;
      });
      lobby.players = updatedPlayers;
      await lobby.save();
    } catch (err) {
      console.log(err);
    }
  })

  socket.on("hide-answer", async () => {
    try {
      const lobbyId = socket.activeLobby;
      const lobby = await Lobby.updateOne(
        { "_id": lobbyId },
        {
          $set: {
            "hasQuestionStarted": true,
            "hasQuestionEnded": true,
            "isShowingAnswer": false,
          }
        }
      );
    } catch (err) {
      console.log(err);
    }
  })

  socket.on("toggle-correct", async (id, correct) => {
    const lobby = await Lobby.findOne({ "players._id": id });
    const player = lobby.players.find((player) => (player._id.toHexString() == id));
    const speed = player.speed || Math.pow(10000, 1/1.01);
    const speedValue = ((10000 - (speed) ** 1.01) / 100) || 0;
    const answerValue = 100 + speedValue;
    if (correct) { // toggle incorrect
      try {
        const newLobby = await Lobby.findOneAndUpdate(
          { "players._id": id },
          { $set: { "players.$[field].correct": false }, $inc: { "players.$[field].score": -answerValue } },
          {
            arrayFilters: [{ "field._id": id }],
            new: true
          }
        );
      } catch (err) {
        console.log(err);
      }
    } else {
      try {
        const newLobby = await Lobby.findOneAndUpdate(
          { "players._id": id },
          { $set: { "players.$[field].correct": true }, $inc: { "players.$[field].score": answerValue } },
          {
            arrayFilters: [{ "field._id": id }],
            new: true
          }
        );
      } catch (err) {
        console.log(err);
      }
    }
  })

  socket.on("next-question", async () => {
    try {
      const lobbyId = socket.activeLobby;
      const newLobby = await Lobby.findOneAndUpdate(
        { "_id": lobbyId },
        {
          $set: {
            "hasQuestionStarted": false,
            "hasQuestionEnded": false,
            "isShowingAnswer": true
          }
        },
        { new: true }
      );
    } catch (err) {
      console.log(err);
    }
  })

  socket.on("submit-answer", async (answer, time) => {
    const id = socket.activePlayer;
    answer = answer.trim();
    try {
      await Lobby.findOneAndUpdate(
        { "players._id": id },
        { $set: { "players.$[field].answer": answer, "players.$[field].speed": time } },
        {
          arrayFilters: [{ "field._id": id }],
          new: true
        }
      );
      socket.emit("message", "submitted answer");
    } catch (err) {
      console.log(err);
    }
  })

  socket.on("logout", async () => {
    const id = socket.activePlayer;
    await Lobby.updateOne(
      { "players._id": id },
      { $pull: { "players": { "_id": id } } }
    );
    socket.emit("logged-out");
    // socket.leave(socket.activeLobby);
    socket.activePlayer = null;
    socket.activeLobby = null;
  });

  socket.on("close-lobby", async () => {
    try {
      const id = socket.activeLobby;
      const deletedLobby = await Lobby.findOneAndRemove({ _id: id });

      // check if the last question had an image and remove
      if (deletedLobby.question.pictureUrl && fs.existsSync(`public/images/${deletedLobby.question.pictureUrl}`)) {
        fs.unlink(`public/images/${deletedLobby.question.pictureUrl}`, (err) => {
          if (err) throw err;
        });
      }

      io.in(id).emit("closed-lobby");
      socket.emit("message", "closed lobby");

      // reset current (main lobby) socket
      socket.leave(id);
      socket.activeLobby = null;

      // reset client sockets
      const clients = io.sockets.adapter.rooms.get(id);
      if (clients) {
        for (const clientId of clients) {
          const clientSocket = io.sockets.sockets.get(clientId);
          clientSocket.leave(id);
          clientSocket.activeLobby = null;
          clientSocket.activePlayer = null;
        }
      }
    } catch (err) {
      console.log(err);
    }
  });

  socket.on("disconnect", () => {
    console.log("A user disconnected: " + socket.id);
  });
});

module.exports = socketapi;