const express = require("express");
const app = express();
const http = require("http").createServer(app);
const io = require("socket.io")(http);

app.use(express.static("public"));

let rooms = {}; // roomKey => { players, boxes, turnOrder, currentTurn }

// Helper: initialize boxes
function initBoxes() {
    const contents = ["bomb", "red","red","red","green","green","green","green","green"];
    return contents.sort(() => Math.random() - 0.5).map(c => ({ content: c, opened: false }));
}

function nextTurn(room) {
    if(room.turnOrder.length === 0) return null;
    room.currentTurn = (room.currentTurn + 1) % room.turnOrder.length;
    return room.turnOrder[room.currentTurn];
}

io.on("connection", (socket) => {
    console.log("New connection:", socket.id);

    let joinedRoom = null;

    // Join room
    socket.on("joinRoom", (roomKey, playerName, callback) => {
        if(!rooms[roomKey]){
            callback({ success:false, message:"Invalid Room Key" });
            return;
        }

        joinedRoom = roomKey;
        const room = rooms[roomKey];

        room.players[socket.id] = { id: socket.id, name: playerName, score:0 };
        room.turnOrder = Object.keys(room.players);

        socket.join(roomKey);

        io.to(roomKey).emit("players", room.players);
        io.to(roomKey).emit("boxes", room.boxes);
        io.to(roomKey).emit("turn", room.turnOrder[room.currentTurn]);

        callback({ success:true });
    });

    // Player guesses
    socket.on("guessBox", (index) => {
        if(!joinedRoom) return;
        const room = rooms[joinedRoom];
        if(socket.id !== room.turnOrder[room.currentTurn]) return;
        if(room.boxes[index].opened) return;

        room.boxes[index].opened = true;
        const content = room.boxes[index].content;

        if(room.players[socket.id]){
            if(content==="green") room.players[socket.id].score +=10;
            else if(content==="red") room.players[socket.id].score -=5;
            else if(content==="bomb") room.players[socket.id].score = 0;
        }

        io.to(joinedRoom).emit("boxes", room.boxes);
        io.to(joinedRoom).emit("players", room.players);

        // Reset if bomb or all opened
        const allOpened = room.boxes.every(b=>b.opened);
        if(content==="bomb" || allOpened){
            room.boxes = initBoxes();
            room.boxes.forEach(b=>b.opened=false);
            io.to(joinedRoom).emit("boxes", room.boxes);
        }

        nextTurn(room);
        io.to(joinedRoom).emit("turn", room.turnOrder[room.currentTurn]);
    });

    // Disconnect
    socket.on("disconnect", ()=>{
        if(!joinedRoom) return;
        const room = rooms[joinedRoom];
        delete room.players[socket.id];
        room.turnOrder = Object.keys(room.players);
        if(room.currentTurn>=room.turnOrder.length) room.currentTurn=0;
        io.to(joinedRoom).emit("players", room.players);
        io.to(joinedRoom).emit("turn", room.turnOrder[room.currentTurn]);
    });
});

// Create rooms manually
function createRoom(roomKey){
    if(!rooms[roomKey]){
        rooms[roomKey] = { players:{}, boxes:initBoxes(), turnOrder:[], currentTurn:0 };
        console.log("Room created:", roomKey);
    }
}

// Example: Pre-create rooms
createRoom("ROOM123");
createRoom("ROOMABC");

const PORT = process.env.PORT || 3000;
http.listen(PORT, ()=>console.log(`Server running on port ${PORT}`));
