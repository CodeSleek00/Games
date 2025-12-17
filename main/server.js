const express = require("express");
const app = express();
const http = require("http").createServer(app);
const io = require("socket.io")(http);

app.use(express.static("public"));

let players = {};

io.on("connection", (socket) => {
    console.log("Player connected:", socket.id);
    
    // Initialize new player
    players[socket.id] = {
        x: Math.random() * 500,
        y: Math.random() * 500,
        color: "#" + Math.floor(Math.random()*16777215).toString(16),
        score: 0,
        name: `Player${Math.floor(Math.random()*1000)}`
    };

    // Send all players to everyone
    io.emit("players", players);

    // Move event
    socket.on("move", (data) => {
        if(players[socket.id]){
            players[socket.id].x += data.dx;
            players[socket.id].y += data.dy;

            // Keep inside canvas
            players[socket.id].x = Math.max(20, Math.min(580, players[socket.id].x));
            players[socket.id].y = Math.max(20, Math.min(580, players[socket.id].y));

            // Collision detection: earn points for touching others
            for(let id in players){
                if(id !== socket.id){
                    let p = players[id];
                    let dx = players[socket.id].x - p.x;
                    let dy = players[socket.id].y - p.y;
                    let distance = Math.sqrt(dx*dx + dy*dy);
                    if(distance < 40){ // circle radius sum
                        players[socket.id].score += 1;
                    }
                }
            }
            io.emit("players", players);
        }
    });

    // Disconnect
    socket.on("disconnect", () => {
        console.log("Player disconnected:", socket.id);
        delete players[socket.id];
        io.emit("players", players);
    });
});

const PORT = process.env.PORT || 3000;
http.listen(PORT, () => console.log(`Server running on port ${PORT}`));
