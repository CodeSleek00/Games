const express = require("express");
const app = express();
const http = require("http").createServer(app);
const io = require("socket.io")(http);

app.use(express.static("public"));

let players = {};
let turnOrder = [];
let currentTurn = 0;
let boxes = []; // array of treasures

const BOX_COUNT = 6;

// Initialize boxes
function resetBoxes() {
    boxes = [];
    for (let i = 0; i < BOX_COUNT; i++) {
        boxes.push({ content: null, opened: false });
    }
}
resetBoxes();

// Assign turn
function nextTurn() {
    if(turnOrder.length === 0) return null;
    currentTurn = (currentTurn + 1) % turnOrder.length;
    return turnOrder[currentTurn];
}

io.on("connection", (socket) => {
    console.log("Player connected:", socket.id);

    players[socket.id] = {
        id: socket.id,
        name: `Player${Math.floor(Math.random()*1000)}`,
        score: 0
    };

    turnOrder = Object.keys(players);

    // Send initial data
    io.emit("players", players);
    io.emit("boxes", boxes);
    io.emit("turn", turnOrder[currentTurn]);

    // Player sets treasure
    socket.on("setTreasure", (data) => {
        if(data.index >= 0 && data.index < BOX_COUNT) {
            boxes[data.index].content = data.content;
        }
        io.emit("boxes", boxes);
    });

    // Player guesses a box
    socket.on("guessBox", (index) => {
        if(socket.id !== turnOrder[currentTurn]) return; // Not this player's turn
        if(boxes[index].opened) return; // Already opened

        boxes[index].opened = true;

        // Award points if content matches guesser name
        if(boxes[index].content && boxes[index].content !== "") {
            if(players[turnOrder[currentTurn]]){
                players[turnOrder[currentTurn]].score += 1;
            }
        }

        io.emit("boxes", boxes);
        io.emit("players", players);

        // Move to next turn
        nextTurn();
        io.emit("turn", turnOrder[currentTurn]);
    });

    // Disconnect
    socket.on("disconnect", () => {
        console.log("Player disconnected:", socket.id);
        delete players[socket.id];
        turnOrder = Object.keys(players);
        if(currentTurn >= turnOrder.length) currentTurn = 0;
        io.emit("players", players);
        io.emit("turn", turnOrder[currentTurn]);
    });
});

const PORT = process.env.PORT || 3000;
http.listen(PORT, () => console.log(`Server running on port ${PORT}`));
