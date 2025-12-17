const express = require("express");
const app = express();
const http = require("http").createServer(app);
const io = require("socket.io")(http);

app.use(express.static("public"));

let rooms = {}; // roomKey => room data

function initBoxes() {
    // Create 9 empty boxes
    return Array.from({length:9},()=>({content:null, opened:false}));
}

function createRoom(roomKey){
    if(!rooms[roomKey]){
        rooms[roomKey] = {
            players:{}, // socket.id => {name, score, roundsPlayed}
            turnOrder:[],
            currentTurn:0,
            boxes:initBoxes(),
            round:1,
            maxRounds:3,
            setter:null, // player who sets boxes
            guesser:null // player who guesses
        };
        console.log("Room created:", roomKey);
    }
}

// Pre-create a sample room
createRoom("ROOM123");

function nextTurn(room){
    // Switch setter/guesser if round complete
    if(room.round > room.maxRounds) return;
    const temp = room.setter;
    room.setter = room.guesser;
    room.guesser = temp;
    room.boxes = initBoxes();
    room.round++;
}

io.on("connection",(socket)=>{
    console.log("Connected:", socket.id);
    let joinedRoom = null;

    // Join room
    socket.on("joinRoom",(roomKey, playerName,callback)=>{
        if(!rooms[roomKey]){
            callback({success:false,message:"Invalid Room Key"});
            return;
        }
        joinedRoom = roomKey;
        const room = rooms[roomKey];

        if(Object.keys(room.players).length>=2){
            callback({success:false,message:"Room Full"});
            return;
        }

        room.players[socket.id] = {id:socket.id,name:playerName,score:0,roundsPlayed:0};
        const ids = Object.keys(room.players);
        if(ids.length===2){
            // assign setter and guesser
            room.setter = ids[0];
            room.guesser = ids[1];
        }

        socket.join(roomKey);
        io.to(roomKey).emit("roomData",room);
        callback({success:true});
    });

    // Setter sets box
    socket.on("setBox",(data)=>{
        const room = rooms[joinedRoom];
        if(socket.id!==room.setter) return;
        if(room.boxes[data.index]) room.boxes[data.index].content = data.content;
        io.to(joinedRoom).emit("roomData",room);
    });

    // Guesser guesses
    socket.on("guessBox",(index)=>{
        const room = rooms[joinedRoom];
        if(socket.id!==room.guesser) return;
        const box = room.boxes[index];
        if(box.opened) return;
        box.opened = true;

        const player = room.players[socket.id];
        if(box.content==="green") player.score+=10;
        else if(box.content==="red") player.score-=5;
        else if(box.content==="bomb") player.score=0;

        io.to(joinedRoom).emit("roomData",room);

        const allOpened = room.boxes.every(b=>b.opened);
        if(box.content==="bomb" || allOpened){
            player.roundsPlayed++;
            if(player.roundsPlayed>=room.maxRounds){
                // Round over for this player, switch roles
                nextTurn(room);
            } else {
                // reset boxes for next round for same roles
                room.boxes = initBoxes();
            }
            io.to(joinedRoom).emit("roomData",room);
        }
    });

    socket.on("disconnect",()=>{
        if(!joinedRoom) return;
        const room = rooms[joinedRoom];
        delete room.players[socket.id];
        room.setter = null;
        room.guesser = null;
        io.to(joinedRoom).emit("roomData",room);
    });
});

const PORT = process.env.PORT||3000;
http.listen(PORT,()=>console.log("Server running on port",PORT));
