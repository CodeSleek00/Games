const express = require("express");
const http = require("http");
const { Server } = require("socket.io");
const path = require("path");

const app = express();
const server = http.createServer(app);
const io = new Server(server, { cors: { origin: "*" } });

app.use(express.static(path.join(__dirname, "public")));

let rooms = {}; // { roomCode: [{id, name, score, role}, ...] }

io.on("connection", socket => {
  console.log("User connected:", socket.id);

  // Join room
  socket.on("joinRoom", ({ room, name }) => {
    socket.join(room);
    if (!rooms[room]) rooms[room] = [];

    if (rooms[room].length < 2) {
      const role = rooms[room].length === 0 ? "drawer" : "guesser";
      rooms[room].push({ id: socket.id, name, score: 0, role });
    }

    io.to(room).emit("playersUpdate", rooms[room]);

    if (rooms[room].length === 2) {
      io.to(room).emit("gameStart", rooms[room]);
    }
  });

  // Drawing
  socket.on("draw", data => {
    socket.to(data.room).emit("draw", data);
  });

  // Check guess
  socket.on("checkGuess", ({ room, guess }) => {
    if (!rooms[room]) return;
    
    const guesser = rooms[room].find(p => p.id === socket.id);
    const drawer = rooms[room].find(p => p.role === "drawer");
    if (!guesser || !drawer) return;

    // Compare guess
    if (guess.toLowerCase() === drawer.name.toLowerCase()) {
      // Assign points
      guesser.score += 100;
      drawer.score += 50;

      // Notify round ended
      io.to(room).emit("roundEnded", {
        winner: guesser.name,
        guesserScore: guesser.score,
        drawerScore: drawer.score
      });

      // Switch roles
      [drawer.role, guesser.role] = [guesser.role, drawer.role];
      io.to(room).emit("playersUpdate", rooms[room]);
    }
  });

  // Disconnect
  socket.on("disconnect", () => {
    for (let room in rooms) {
      rooms[room] = rooms[room].filter(p => p.id !== socket.id);
      io.to(room).emit("playersUpdate", rooms[room]);
      if (rooms[room].length === 0) delete rooms[room];
    }
    console.log("User disconnected:", socket.id);
  });
});

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => console.log(`Server running on port ${PORT}`));
