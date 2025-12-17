const express = require("express");
const app = express();
const http = require("http").createServer(app);
const io = require("socket.io")(http);

app.use(express.static("public"));

let rooms = {}; // roomKey => room data

function initBoxes() {
    return Array.from({length:9},()=>({content:null, opened:false}));
}

function createRoom(roomKey){
    if(!rooms[roomKey]){
        rooms[roomKey] = {
            players:{}, // socket.id => {name, score, roundsPlayed}
            setter:null,
            guesser:null,
            boxes:initBoxes(),
            round:1,
            maxRounds:3,
        };
        console.log("Room created:", roomKey);
    }
}

// Pre-create a sample room
createRoom("ROOM123");

function nextTurn(room){
    // Swap setter and guesser after rounds
    const temp = room.setter;
    room.setter = room.guesser;
    room.guesser = temp;
    room.boxes = initBoxes();
    room.round++;
}

io.on("connection",(socket)=>{
    console.log("Connected:", socket.id);
    let joinedRoom = null;

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
        if(ids.length===2 && !room.setter && !room.guesser){
            room.setter = ids[0];
            room.guesser = ids[1];
        }

        socket.join(roomKey);
        io.to(roomKey).emit("roomData",room);
        callback({success:true});
    });

    // Setter selects Red/Bomb box
    socket.on("setBox",(data)=>{
        const room = rooms[joinedRoom];
        if(socket.id!==room.setter) return;
        if(room.boxes[data.index]) room.boxes[data.index].content = data.content;

        // Count red and bomb
        const redCount = room.boxes.filter(b=>b.content==="red").length;
        const bombCount = room.boxes.filter(b=>b.content==="bomb").length;
        if(redCount===3 && bombCount===1){
            // Fill remaining boxes as green automatically
            room.boxes.forEach(b=>{
                if(!b.content) b.content="green";
            });
        }

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
                nextTurn(room);
            } else {
                room.boxes = initBoxes();
            }
            io.to(joinedRoom).emit("roomData",room);
        }
    });

    socket.on("disconnect",()=>{
        if(!joinedRoom) return;
        const room = rooms[joinedRoom];
        delete room.players[socket.id];
        if(room.setter===socket.id) room.setter=null;
        if(room.guesser===socket.id) room.guesser=null;
        io.to(joinedRoom).emit("roomData",room);
    });
});

const PORT = process.env.PORT||3000;
http.listen(PORT,()=>console.log("Server running on port",PORT));
