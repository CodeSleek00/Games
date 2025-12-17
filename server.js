// Import modules
const express = require("express");
const http = require("http");
const { Server } = require("socket.io");
const path = require("path");

// Express app
const app = express();
const server = http.createServer(app);

// Socket.io server
const io = new Server(server, {
  cors: { origin: "*" } // allow any origin
});

// Serve frontend
app.use(express.static(path.join(__dirname, "public")));

// Rooms storage
let rooms = {}; // { roomCode: [{id, name, score, role}, ...] }

// Socket connection
io.on("connection", socket => {
  console.log("User connected:", socket.id);

  // Join room
  socket.on("joinRoom", ({ room, name }) => {
    socket.join(room);

    if (!rooms[room]) rooms[room] = [];

    if (rooms[room].length < 2) {
      // Assign role: drawer / guesser
      const role = rooms[room].length === 0 ? "drawer" : "guesser";
      rooms[room].push({ id: socket.id, name, score: 0, role });
    }

    // Emit updated players list
    io.to(room).emit("playersUpdate", rooms[room]);

    // If 2 players, start game
    if (rooms[room].length === 2) {
      io.to(room).emit("gameStart", rooms[room]);
    }
  });

  // Drawing event
  socket.on("draw", data => {
    socket.to(data.room).emit("draw", data); // broadcast to other player
  });

  // Guessing event
  socket.on("guess", ({ room, guess }) => {
    io.to(room).emit("guess", { playerId: socket.id, guess });
  });

  // Update score
  socket.on("updateScore", ({ room, playerId, points }) => {
    if (!rooms[room]) return;
    const player = rooms[room].find(p => p.id === playerId);
    if (player) player.score += points;
    io.to(room).emit("playersUpdate", rooms[room]);
  });

  // Disconnect
  socket.on("disconnect", () => {
    for (const room in rooms) {
      rooms[room] = rooms[room].filter(p => p.id !== socket.id);
      io.to(room).emit("playersUpdate", rooms[room]);
      if (rooms[room].length === 0) delete rooms[room];
    }
    console.log("User disconnected:", socket.id);
  });
});

// Start server
const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
