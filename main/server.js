const express = require("express");
const http = require("http");
const { Server } = require("socket.io");
const path = require("path");

const app = express();
const server = http.createServer(app);
const io = new Server(server, { cors: { origin: "*" } });

app.use(express.static(path.join(__dirname, "public")));

let rooms = {}; // { roomCode: { players: [{id,name,score,role}], timer, round } }

io.on("connection", socket => {
  console.log("User connected:", socket.id);

  socket.on("joinRoom", ({ room, name }) => {
    socket.join(room);

    if (!rooms[room]) rooms[room] = { players: [], round: 1, timer: null };

    if (rooms[room].players.length < 2) {
      const role = rooms[room].players.length === 0 ? "drawer" : "guesser";
      rooms[room].players.push({ id: socket.id, name, score: 0, role });
    }

    io.to(room).emit("playersUpdate", rooms[room].players);

    if (rooms[room].players.length === 2) startRound(room);
  });

  // Drawing
  socket.on("draw", data => {
    socket.to(data.room).emit("draw", data);
  });

  // Guessing
  socket.on("checkGuess", ({ room, guess }) => {
    const roomObj = rooms[room];
    if (!roomObj) return;

    const drawer = roomObj.players.find(p => p.role === "drawer");
    const guesser = roomObj.players.find(p => p.id === socket.id);

    if (!drawer || !guesser) return;

    if (guess.toLowerCase() === drawer.name.toLowerCase()) {
      // Calculate points based on timer
      const remainingTime = roomObj.remainingTime || 60;
      const guesserPoints = 100 + Math.floor(remainingTime / 2); // fast guess bonus
      const drawerPoints = 50;

      guesser.score += guesserPoints;
      drawer.score += drawerPoints;

      io.to(room).emit("roundEnded", {
        winner: guesser.name,
        guesserScore: guesser.score,
        drawerScore: drawer.score,
        remainingTime,
        guesserPoints,
        drawerPoints
      });

      switchRoles(room);
      startRound(room);
    }
  });

  socket.on("disconnect", () => {
    for (let room in rooms) {
      rooms[room].players = rooms[room].players.filter(p => p.id !== socket.id);
      io.to(room).emit("playersUpdate", rooms[room].players);
      if (rooms[room].players.length === 0) {
        clearInterval(rooms[room].timer);
        delete rooms[room];
      }
    }
    console.log("User disconnected:", socket.id);
  });
});

// Helper functions

function startRound(room) {
  const roomObj = rooms[room];
  if (!roomObj) return;

  roomObj.remainingTime = 60;
  io.to(room).emit("newRound", { round: roomObj.round, remainingTime: roomObj.remainingTime });

  clearInterval(roomObj.timer);
  roomObj.timer = setInterval(() => {
    roomObj.remainingTime--;
    io.to(room).emit("timerUpdate", roomObj.remainingTime);
    if (roomObj.remainingTime <= 0) {
      io.to(room).emit("roundEnded", { winner: null });
      switchRoles(room);
      roomObj.round++;
      startRound(room);
    }
  }, 1000);
}

function switchRoles(room) {
  const roomObj = rooms[room];
  if (!roomObj) return;
  roomObj.players.forEach(p => {
    p.role = p.role === "drawer" ? "guesser" : "drawer";
  });
  io.to(room).emit("playersUpdate", roomObj.players);
}

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => console.log(`Server running on port ${PORT}`));
