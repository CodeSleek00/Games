const socket = io();

// DOM Elements
const boxesContainer = document.getElementById("boxesContainer");
const scoreboard = document.getElementById("scoreboard");
const roleInfo = document.getElementById("roleInfo");
const turnInfo = document.getElementById("turnInfo");
const roundInfo = document.getElementById("roundInfo");
const gameMessage = document.getElementById("gameMessage");
const lobby = document.getElementById("lobby");
const gameArea = document.getElementById("gameArea");
const gameOver = document.getElementById("gameOver");
const lobbyMsg = document.getElementById("lobbyMsg");
const joinBtn = document.getElementById("joinBtn");
const confirmBtn = document.getElementById("confirmBtn");
const leaveBtn = document.getElementById("leaveBtn");
const playAgainBtn = document.getElementById("playAgainBtn");
const newGameBtn = document.getElementById("newGameBtn");
const playerNameInput = document.getElementById("playerName");
const roomKeyInput = document.getElementById("roomKey");
const selectionStatus = document.getElementById("selectionStatus");
const finalScores = document.getElementById("finalScores");

let roomData = {};
let myId = null;
let myName = "";
let selectedRed = 0;
let selectedBomb = 0;

// Screen Management
function showScreen(screenName) {
    document.querySelectorAll('.screen').forEach(screen => {
        screen.classList.remove('active');
    });
    const screen = document.getElementById(screenName);
    if (screen) {
        screen.classList.add('active');
    }
}

// Join Room
joinBtn.onclick = () => {
    const name = playerNameInput.value.trim();
    const roomKey = roomKeyInput.value.trim();
    
    if (!name || !roomKey) {
        showMessage(lobbyMsg, "Please enter both name and room key", "error");
        return;
    }
    
    if (name.length < 2) {
        showMessage(lobbyMsg, "Name must be at least 2 characters", "error");
        return;
    }
    
    myName = name;
    socket.emit("joinRoom", roomKey, name, (res) => {
        if (res.success) {
            showScreen("gameArea");
            myId = socket.id;
            showMessage(lobbyMsg, "", "");
        } else {
            showMessage(lobbyMsg, res.message, "error");
        }
    });
};

// Leave Game
leaveBtn.onclick = () => {
    if (confirm("Are you sure you want to leave the game?")) {
        socket.disconnect();
        socket.connect();
        showScreen("lobby");
        myId = null;
        roomData = {};
    }
};

// Message Helper
function showMessage(element, message, type = "") {
    element.textContent = message;
    element.className = "message";
    if (type) {
        element.classList.add(type);
    }
}

// Render Boxes
function renderBoxes() {
    boxesContainer.innerHTML = "";
    
    if (!roomData.boxes || roomData.boxes.length === 0) {
        return;
    }
    
    roomData.boxes.forEach((box, idx) => {
        const div = document.createElement("div");
        div.classList.add("box");
        
        if (box.opened) {
            div.classList.add("opened");
            if (box.content === "green") {
                div.classList.add("green");
                div.textContent = "✅";
            } else if (box.content === "red") {
                div.classList.add("red");
                div.textContent = "⚑";
            } else if (box.content === "bomb") {
                div.classList.add("bomb");
                div.textContent = "💣";
            }
        } else {
            div.textContent = "?";
        }

        // Setter can select boxes
        if (myId === roomData.setter && !box.opened && !box.content) {
            div.onclick = () => {
                if (selectedRed < 3) {
                    box.content = "red";
                    selectedRed++;
                    socket.emit("setBox", { index: idx, content: box.content });
                    updateSelectionStatus();
                } else if (selectedBomb < 1) {
                    box.content = "bomb";
                    selectedBomb++;
                    socket.emit("setBox", { index: idx, content: box.content });
                    updateSelectionStatus();
                }
            };
        }
        // Guesser can guess
        else if (myId === roomData.guesser && !box.opened && box.content) {
            div.onclick = () => {
                socket.emit("guessBox", idx);
            };
        }
        // Disabled state
        else {
            div.style.cursor = "not-allowed";
            div.style.opacity = "0.6";
        }
        
        boxesContainer.appendChild(div);
    });
}

// Update Selection Status
function updateSelectionStatus() {
    if (myId === roomData.setter) {
        const remaining = {
            red: 3 - selectedRed,
            bomb: 1 - selectedBomb
        };
        let statusText = "";
        if (remaining.red > 0 || remaining.bomb > 0) {
            statusText = `Select: ${remaining.red} red box${remaining.red !== 1 ? 'es' : ''}, ${remaining.bomb} bomb`;
        } else {
            statusText = "✓ Selection complete! Click confirm to start guessing.";
        }
        selectionStatus.textContent = statusText;
    } else {
        selectionStatus.textContent = "";
    }
}

// Confirm Boxes
confirmBtn.onclick = () => {
    if (selectedRed === 3 && selectedBomb === 1) {
        socket.emit("confirmBoxes");
        confirmBtn.style.display = "none";
        showMessage(gameMessage, "Waiting for guesser to start...", "success");
    }
};

// Render Scoreboard
function renderScoreboard() {
    scoreboard.innerHTML = "";
    
    if (!roomData.players) return;
    
    const players = Object.values(roomData.players).sort((a, b) => b.score - a.score);
    
    players.forEach((player) => {
        const item = document.createElement("div");
        item.classList.add("scoreboard-item");
        
        if (player.id === myId) {
            item.classList.add("current-player");
        }
        
        const playerInfo = document.createElement("div");
        playerInfo.classList.add("player-info");
        
        const avatar = document.createElement("div");
        avatar.classList.add("player-avatar");
        avatar.textContent = player.name.charAt(0).toUpperCase();
        
        const nameContainer = document.createElement("div");
        const name = document.createElement("div");
        name.classList.add("player-name");
        name.textContent = player.name;
        
        const role = document.createElement("div");
        role.classList.add("player-role");
        if (player.id === roomData.setter) {
            role.textContent = "🎯 Setter";
        } else if (player.id === roomData.guesser) {
            role.textContent = "🔍 Guesser";
        } else {
            role.textContent = "⏳ Waiting";
        }
        
        nameContainer.appendChild(name);
        nameContainer.appendChild(role);
        playerInfo.appendChild(avatar);
        playerInfo.appendChild(nameContainer);
        
        const score = document.createElement("div");
        score.classList.add("player-score");
        score.textContent = player.score;
        
        item.appendChild(playerInfo);
        item.appendChild(score);
        scoreboard.appendChild(item);
    });
}

// Update UI
function updateUI() {
    renderBoxes();
    renderScoreboard();
    
    if (roomData.round && roomData.maxRounds) {
        roundInfo.textContent = `Round ${roomData.round} / ${roomData.maxRounds}`;
    }
    
    // Role Info
    if (myId === roomData.setter) {
        roleInfo.textContent = "🎯 Box Setter";
        roleInfo.style.background = "linear-gradient(135deg, #f59e0b 0%, #d97706 100%)";
    } else if (myId === roomData.guesser) {
        roleInfo.textContent = "🔍 Guesser";
        roleInfo.style.background = "linear-gradient(135deg, #6366f1 0%, #4f46e5 100%)";
    } else {
        roleInfo.textContent = "⏳ Waiting";
        roleInfo.style.background = "linear-gradient(135deg, #64748b 0%, #475569 100%)";
    }
    
    // Turn Info
    if (roomData.guesser && roomData.players[roomData.guesser]) {
        const guesserName = roomData.players[roomData.guesser].name;
        turnInfo.textContent = `Current Guesser: ${guesserName}`;
    } else {
        turnInfo.textContent = "Waiting for players...";
    }
    
    // Game Message
    if (myId === roomData.setter) {
        if (selectedRed < 3 || selectedBomb < 1) {
            showMessage(gameMessage, "Place 3 red boxes and 1 bomb", "");
        } else if (confirmBtn.style.display === "none") {
            showMessage(gameMessage, "Click confirm when ready", "success");
        }
    } else if (myId === roomData.guesser) {
        if (roomData.boxes && roomData.boxes.some(b => b.content && !b.opened)) {
            showMessage(gameMessage, "Click boxes to reveal! Find green for points!", "");
        } else {
            showMessage(gameMessage, "Waiting for setter to place boxes...", "");
        }
    } else {
        showMessage(gameMessage, "Waiting for another player to join...", "");
    }
    
    // Confirm Button
    if (myId === roomData.setter && selectedRed === 3 && selectedBomb === 1) {
        confirmBtn.style.display = "block";
    } else {
        confirmBtn.style.display = "none";
    }
    
    updateSelectionStatus();
}

// Reset selection counters
function resetSelection() {
    selectedRed = 0;
    selectedBomb = 0;
    if (roomData.boxes) {
        roomData.boxes.forEach(box => {
            if (!box.opened && box.content) {
                if (box.content === "red") selectedRed++;
                if (box.content === "bomb") selectedBomb++;
            }
        });
    }
}

// Listen for room data updates
socket.on("roomData", (data) => {
    roomData = data;
    resetSelection();
    updateUI();
});

// Start guessing phase
socket.on("startGuessing", () => {
    showMessage(gameMessage, "🎮 Guessing phase started! Click boxes to reveal!", "success");
    resetSelection();
    updateUI();
});

// Box revealed feedback
socket.on("boxRevealed", (data) => {
    const { index, content, score } = data;
    let message = "";
    
    if (content === "green") {
        message = `✅ Green box! +10 points!`;
    } else if (content === "red") {
        message = `⚑ Red box! -5 points!`;
    } else if (content === "bomb") {
        message = `💣 BOMB! Score reset to 0!`;
    }
    
    if (myId === roomData.guesser) {
        showMessage(gameMessage, message, content === "green" ? "success" : "error");
    }
});

// Round end
socket.on("roundEnd", (data) => {
    showMessage(gameMessage, `Round ${data.round} ended!`, "success");
    setTimeout(() => {
        if (data.round < data.maxRounds) {
            showMessage(gameMessage, "Next round starting...", "");
        }
    }, 2000);
});

// Game over
socket.on("gameOver", (data) => {
    showScreen("gameOver");
    
    const players = Object.values(data.players).sort((a, b) => b.score - a.score);
    const winner = players[0];
    
    finalScores.innerHTML = `
        <div class="winner-badge">
            🏆 Winner: ${winner.name} with ${winner.score} points!
        </div>
        <div class="scoreboard">
            ${players.map((p, idx) => `
                <div class="scoreboard-item ${p.id === myId ? 'current-player' : ''}">
                    <div class="player-info">
                        <div class="player-avatar">${p.name.charAt(0).toUpperCase()}</div>
                        <div>
                            <div class="player-name">${p.name}</div>
                            <div class="player-role">#${idx + 1} Place</div>
                        </div>
                    </div>
                    <div class="player-score">${p.score}</div>
                </div>
            `).join('')}
        </div>
    `;
});

// Play Again
playAgainBtn.onclick = () => {
    socket.emit("playAgain");
    showScreen("gameArea");
};

// New Game
newGameBtn.onclick = () => {
    socket.disconnect();
    socket.connect();
    showScreen("lobby");
    myId = null;
    roomData = {};
    playerNameInput.value = "";
    roomKeyInput.value = "";
};

// Connection status
socket.on("connect", () => {
    console.log("Connected to server");
});

socket.on("disconnect", () => {
    showMessage(lobbyMsg, "Disconnected from server", "error");
});

// Enter key to join
playerNameInput.addEventListener("keypress", (e) => {
    if (e.key === "Enter") {
        roomKeyInput.focus();
    }
});

roomKeyInput.addEventListener("keypress", (e) => {
    if (e.key === "Enter") {
        joinBtn.click();
    }
});
