const express = require("express");
const app = express();
const http = require("http").createServer(app);
const io = require("socket.io")(http);

app.use(express.static("public"));

let players = {};
let turnOrder = [];
let currentTurn = 0;
let boxes = [];

// Initialize boxes with content
function initBoxes() {
    const contents = ["bomb", "red","red","red","green","green","green","green","green"];
    boxes = contents.sort(() => Math.random() - 0.5).map(c => ({ content: c, opened: false }));
}

initBoxes();

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

    io.emit("players", players);
    io.emit("boxes", boxes);
    io.emit("turn", turnOrder[currentTurn]);

    // Player guesses box
    socket.on("guessBox", (index) => {
        if(socket.id !== turnOrder[currentTurn]) return; // Not player's turn
        if(boxes[index].opened) return; // Already opened

        boxes[index].opened = true;
        const content = boxes[index].content;

        if(players[socket.id]){
            if(content === "green") players[socket.id].score += 10;
            else if(content === "red") players[socket.id].score -= 5;
            else if(content === "bomb") players[socket.id].score = 0;
        }

        io.emit("boxes", boxes);
        io.emit("players", players);

        // If bomb or all boxes opened, reset boxes for next turn
        const allOpened = boxes.every(b => b.opened);
        if(content === "bomb" || allOpened){
            initBoxes();
            boxes.forEach(b => b.opened = false);
            io.emit("boxes", boxes);
        }

        // Next turn
        nextTurn();
        io.emit("turn", turnOrder[currentTurn]);
    });

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
