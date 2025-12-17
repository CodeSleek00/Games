const express = require("express");
const http = require("http");
const { Server } = require("socket.io");

const app = express();
const server = http.createServer(app);
const io = new Server(server);

app.use(express.static("public"));

let rooms = {};

io.on("connection", (socket) => {
  console.log("User connected:", socket.id);

  socket.on("joinRoom", ({ room, name }) => {
    socket.join(room);

    if (!rooms[room]) rooms[room] = [];
    if (rooms[room].length < 2) {
      rooms[room].push({ id: socket.id, name, score: 0 });
    }

    io.to(room).emit("roomUpdate", rooms[room]);

    if (rooms[room].length === 2) {
      io.to(room).emit("gameReady");
    }
  });

  socket.on("draw", (data) => {
    socket.to(data.room).emit("draw", data);
  });

  socket.on("guess", ({ room, guess }) => {
    io.to(room).emit("guess", guess);
  });

  socket.on("disconnect", () => {
    for (let room in rooms) {
      rooms[room] = rooms[room].filter(p => p.id !== socket.id);
      io.to(room).emit("roomUpdate", rooms[room]);
    }
  });
});

server.listen(3000, () => {
  console.log("Server running on http://localhost:3000");
});
