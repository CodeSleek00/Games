const express = require("express");
const app = express();
const http = require("http").createServer(app);
const io = require("socket.io")(http);

app.use(express.static("public"));

let rooms = {}; // roomKey => room data

function initBoxes() {
    return Array.from({ length: 9 }, () => ({ content: null, opened: false }));
}

function createRoom(roomKey) {
    if (!rooms[roomKey]) {
        rooms[roomKey] = {
            players: {}, // socket.id => {id, name, score, roundsPlayed}
            setter: null,
            guesser: null,
            boxes: initBoxes(),
            round: 1,
            maxRounds: 3,
            gameState: "waiting", // waiting, setting, guessing, roundEnd, gameOver
            confirmed: false
        };
        console.log("Room created:", roomKey);
    }
}

// Pre-create a sample room
createRoom("ROOM123");

function nextTurn(room) {
    const temp = room.setter;
    room.setter = room.guesser;
    room.guesser = temp;
    room.boxes = initBoxes();
    room.confirmed = false;
    room.gameState = "setting";
    room.round++;
    
    // Check if game should end
    if (room.round > room.maxRounds) {
        room.gameState = "gameOver";
    }
}

function broadcastRoomData(roomKey) {
    const room = rooms[roomKey];
    if (room) {
        io.to(roomKey).emit("roomData", room);
    }
}

function checkGameEnd(room) {
    const allPlayersPlayed = Object.values(room.players).every(
        player => player.roundsPlayed >= room.maxRounds
    );
    
    if (allPlayersPlayed && room.round > room.maxRounds) {
        room.gameState = "gameOver";
        io.to(Object.keys(rooms).find(key => rooms[key] === room)).emit("gameOver", room);
        return true;
    }
    return false;
}

io.on("connection", (socket) => {
    console.log("Connected:", socket.id);
    let joinedRoom = null;

    socket.on("joinRoom", (roomKey, playerName, callback) => {
        if (!rooms[roomKey]) {
            callback({ success: false, message: "Invalid Room Key" });
            return;
        }
        
        joinedRoom = roomKey;
        const room = rooms[roomKey];

        if (Object.keys(room.players).length >= 2) {
            callback({ success: false, message: "Room is full (max 2 players)" });
            return;
        }

        // Check if name already exists in room
        const nameExists = Object.values(room.players).some(
            p => p.name.toLowerCase() === playerName.toLowerCase()
        );
        if (nameExists) {
            callback({ success: false, message: "Name already taken in this room" });
            return;
        }

        room.players[socket.id] = {
            id: socket.id,
            name: playerName,
            score: 0,
            roundsPlayed: 0
        };

        const ids = Object.keys(room.players);
        
        // Initialize game when 2 players join
        if (ids.length === 2 && !room.setter && !room.guesser) {
            room.setter = ids[0];
            room.guesser = ids[1];
            room.gameState = "setting";
            room.boxes = initBoxes();
        }

        socket.join(roomKey);
        broadcastRoomData(roomKey);
        callback({ success: true });
    });

    // Setter selects boxes (red/bomb)
    socket.on("setBox", (data) => {
        if (!joinedRoom) return;
        const room = rooms[joinedRoom];
        if (!room || socket.id !== room.setter) return;
        if (room.gameState !== "setting") return;
        
        const box = room.boxes[data.index];
        if (!box || box.opened || box.content) return;

        box.content = data.content;

        // Check if selection complete
        const redCount = room.boxes.filter(b => b.content === "red").length;
        const bombCount = room.boxes.filter(b => b.content === "bomb").length;
        
        if (redCount === 3 && bombCount === 1) {
            // Fill remaining with green
            room.boxes.forEach(b => {
                if (!b.content) b.content = "green";
            });
        }

        broadcastRoomData(joinedRoom);
    });

    // Setter confirms selection
    socket.on("confirmBoxes", () => {
        if (!joinedRoom) return;
        const room = rooms[joinedRoom];
        if (!room || socket.id !== room.setter) return;
        if (room.gameState !== "setting") return;

        const redCount = room.boxes.filter(b => b.content === "red").length;
        const bombCount = room.boxes.filter(b => b.content === "bomb").length;

        if (redCount === 3 && bombCount === 1) {
            room.confirmed = true;
            room.gameState = "guessing";
            io.to(joinedRoom).emit("startGuessing");
            broadcastRoomData(joinedRoom);
        }
    });

    // Guesser submits turn early (keeps current score)
    socket.on("submitTurn", () => {
        if (!joinedRoom) return;
        const room = rooms[joinedRoom];
        if (!room || socket.id !== room.guesser) return;
        if (room.gameState !== "guessing") return;

        const player = room.players[socket.id];
        const hasOpenedBoxes = room.boxes.some(b => b.opened);
        
        // Only allow submit if player has opened at least one box
        if (!hasOpenedBoxes) {
            return;
        }

        // Player keeps their current score, round ends
        player.roundsPlayed++;
        
        // Notify player
        socket.emit("turnSubmitted", {
            score: player.score
        });

        // Check if game should end
        if (checkGameEnd(room)) {
            return;
        }

        // Check if we need to switch turns
        const otherPlayerId = Object.keys(room.players).find(id => id !== socket.id);
        const otherPlayer = room.players[otherPlayerId];
        
        if (otherPlayer && otherPlayer.roundsPlayed < room.maxRounds) {
            // Switch roles for next round
            nextTurn(room);
            io.to(joinedRoom).emit("roundEnd", {
                round: room.round - 1,
                maxRounds: room.maxRounds,
                reason: "submitted"
            });
        } else if (room.round < room.maxRounds) {
            // Continue with same roles, new round
            room.boxes = initBoxes();
            room.confirmed = false;
            room.gameState = "setting";
            io.to(joinedRoom).emit("roundEnd", {
                round: room.round,
                maxRounds: room.maxRounds,
                reason: "submitted"
            });
        } else {
            // Game over
            room.gameState = "gameOver";
            io.to(joinedRoom).emit("gameOver", room);
        }
        
        broadcastRoomData(joinedRoom);
    });

    // Guesser guesses
    socket.on("guessBox", (index) => {
        if (!joinedRoom) return;
        const room = rooms[joinedRoom];
        if (!room || socket.id !== room.guesser) return;
        if (room.gameState !== "guessing") return;

        const box = room.boxes[index];
        if (!box || box.opened || !box.content) return;

        box.opened = true;
        const player = room.players[socket.id];
        const oldScore = player.score;
        
        if (box.content === "green") {
            player.score += 10;
        } else if (box.content === "red") {
            player.score = Math.max(0, player.score - 5);
        } else if (box.content === "bomb") {
            player.score = 0;
        }

        // Emit box revealed event
        io.to(joinedRoom).emit("boxRevealed", {
            index: index,
            content: box.content,
            score: player.score,
            oldScore: oldScore
        });

        broadcastRoomData(joinedRoom);

        // Check if round should end
        const allOpened = room.boxes.every(b => b.opened);
        const bombHit = box.content === "bomb";

        if (bombHit || allOpened) {
            player.roundsPlayed++;
            
            // Check if game should end
            if (checkGameEnd(room)) {
                return;
            }

            // Check if we need to switch turns
            const otherPlayerId = Object.keys(room.players).find(id => id !== socket.id);
            const otherPlayer = room.players[otherPlayerId];
            
            if (otherPlayer && otherPlayer.roundsPlayed < room.maxRounds) {
                // Switch roles for next round
                nextTurn(room);
                io.to(joinedRoom).emit("roundEnd", {
                    round: room.round - 1,
                    maxRounds: room.maxRounds
                });
            } else if (room.round < room.maxRounds) {
                // Continue with same roles, new round
                room.boxes = initBoxes();
                room.confirmed = false;
                room.gameState = "setting";
                io.to(joinedRoom).emit("roundEnd", {
                    round: room.round,
                    maxRounds: room.maxRounds
                });
            } else {
                // Game over
                room.gameState = "gameOver";
                io.to(joinedRoom).emit("gameOver", room);
            }
            
            broadcastRoomData(joinedRoom);
        }
    });

    // Play again
    socket.on("playAgain", () => {
        if (!joinedRoom) return;
        const room = rooms[joinedRoom];
        if (!room) return;

        // Reset game
        Object.values(room.players).forEach(player => {
            player.score = 0;
            player.roundsPlayed = 0;
        });
        
        const ids = Object.keys(room.players);
        if (ids.length === 2) {
            room.setter = ids[0];
            room.guesser = ids[1];
        }
        
        room.boxes = initBoxes();
        room.round = 1;
        room.gameState = "setting";
        room.confirmed = false;
        
        broadcastRoomData(joinedRoom);
    });

    socket.on("disconnect", () => {
        if (!joinedRoom) return;
        const room = rooms[joinedRoom];
        if (!room) return;

        delete room.players[socket.id];
        
        if (room.setter === socket.id) {
            room.setter = null;
        }
        if (room.guesser === socket.id) {
            room.guesser = null;
        }

        // Reset game if player left
        if (Object.keys(room.players).length < 2) {
            room.setter = null;
            room.guesser = null;
            room.boxes = initBoxes();
            room.gameState = "waiting";
            room.confirmed = false;
        }

        broadcastRoomData(joinedRoom);
        console.log("Disconnected:", socket.id);
    });
});

const PORT = process.env.PORT || 3000;
http.listen(PORT, () => {
    console.log(`🎮 Treasure Hunt Pro server running on port ${PORT}`);
    console.log(`📍 Open http://localhost:${PORT} to play`);
});
