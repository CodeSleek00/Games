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
const submitBtn = document.getElementById("submitBtn");
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
        
        // Helper function to create image element
        const createImage = (type) => {
            const img = document.createElement("img");
            img.style.width = "75%";
            img.style.height = "75%";
            img.style.objectFit = "contain";
            img.style.userSelect = "none";
            
            if (type === "green") {
                // Green flag SVG - better design
                img.src = "data:image/svg+xml,%3Csvg xmlns='greenflag.png' viewBox='0 0 100 100'%3E%3Crect x='10' y='10' width='8' height='80' fill='%23d97706'/%3E%3Cpath d='M18 15 L70 25 L70 45 L18 35 Z' fill='%2310b981'/%3E%3Cpath d='M18 35 L70 45 L70 65 L18 55 Z' fill='%23059669'/%3E%3C/svg%3E";
                img.alt = "Green Flag";
            } else if (type === "red") {
                // Red flag SVG - better design
                img.src = "data:image/svg+xml,%3Csvg xmlns='redflag.png' viewBox='0 0 100 100'%3E%3Crect x='10' y='10' width='8' height='80' fill='%23d97706'/%3E%3Cpath d='M18 15 L70 25 L70 45 L18 35 Z' fill='%23ef4444'/%3E%3Cpath d='M18 35 L70 45 L70 65 L18 55 Z' fill='%23dc2626'/%3E%3C/svg%3E";
                img.alt = "Red Flag";
            } else if (type === "bomb") {
                // Bomb SVG - better design
                img.src = "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 100'%3E%3Ccircle cx='50' cy='50' r='35' fill='%231f2937' stroke='%23000000' stroke-width='3'/%3E%3Ccircle cx='50' cy='50' r='28' fill='%23000000'/%3E%3Ccircle cx='50' cy='50' r='20' fill='%23ef4444' opacity='0.8'/%3E%3Cpath d='M50 20 L52 30 L48 30 Z' fill='%23f59e0b'/%3E%3Cpath d='M50 80 L52 70 L48 70 Z' fill='%23f59e0b'/%3E%3Cpath d='M20 50 L30 52 L30 48 Z' fill='%23f59e0b'/%3E%3Cpath d='M80 50 L70 52 L70 48 Z' fill='%23f59e0b'/%3E%3Cpath d='M32 32 L38 38 L35 41 L28 34 Z' fill='%23f59e0b'/%3E%3Cpath d='M68 32 L62 38 L65 41 L72 34 Z' fill='%23f59e0b'/%3E%3Cpath d='M32 68 L38 62 L35 59 L28 66 Z' fill='%23f59e0b'/%3E%3Cpath d='M68 68 L62 62 L65 59 L72 66 Z' fill='%23f59e0b'/%3E%3C/svg%3E";
                img.alt = "Bomb";
            }
            return img;
        };
        
        if (box.opened) {
            div.classList.add("opened");
            if (box.content === "green") {
                div.classList.add("green");
                div.appendChild(createImage("green"));
            } else if (box.content === "red") {
                div.classList.add("red");
                div.appendChild(createImage("red"));
            } else if (box.content === "bomb") {
                div.classList.add("bomb");
                div.appendChild(createImage("bomb"));
            }
        } else {
            // Show setter's selection even if not opened (ONLY visible to setter, NOT guesser)
            if (myId === roomData.setter && box.content && roomData.gameState === "setting") {
                if (box.content === "red") {
                    div.classList.add("red");
                    div.style.opacity = "0.9";
                    div.style.border = "3px solid #ef4444";
                    div.style.boxShadow = "0 0 15px rgba(239, 68, 68, 0.5)";
                    div.appendChild(createImage("red"));
                    div.title = "Red Flag (Click to remove)";
                } else if (box.content === "bomb") {
                    div.classList.add("bomb");
                    div.style.opacity = "0.9";
                    div.style.border = "3px solid #1f2937";
                    div.style.boxShadow = "0 0 15px rgba(31, 41, 55, 0.5)";
                    div.appendChild(createImage("bomb"));
                    div.title = "Bomb (Click to remove)";
                } else if (box.content === "green") {
                    div.classList.add("green");
                    div.style.opacity = "0.7";
                    div.appendChild(createImage("green"));
                    div.title = "Green (Auto-filled)";
                }
            } else {
                // Guesser sees only "?" - setter's selection is hidden
                div.textContent = "?";
            }
        }

        // Setter can select/change boxes (before confirming)
        if (myId === roomData.setter && !box.opened && roomData.gameState === "setting") {
            div.onclick = () => {
                // If box already has content, allow changing it
                if (box.content === "red") {
                    box.content = null;
                    selectedRed--;
                    socket.emit("setBox", { index: idx, content: null });
                    updateSelectionStatus();
                } else if (box.content === "bomb") {
                    box.content = null;
                    selectedBomb--;
                    socket.emit("setBox", { index: idx, content: null });
                    updateSelectionStatus();
                } else if (box.content === "green") {
                    box.content = null;
                    socket.emit("setBox", { index: idx, content: null });
                    updateSelectionStatus();
                }
                // If box is empty, allow selecting
                else if (!box.content) {
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

// Submit Turn (Guesser can end turn early)
submitBtn.onclick = () => {
    if (confirm("Are you sure you want to submit? You'll keep your current score and end your turn.")) {
        socket.emit("submitTurn");
        submitBtn.style.display = "none";
        showMessage(gameMessage, "Turn submitted! Your score is safe.", "success");
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
        const hasUnopenedBoxes = roomData.boxes && roomData.boxes.some(b => b.content && !b.opened);
        if (hasUnopenedBoxes) {
            showMessage(gameMessage, "Click boxes to reveal! Find green for points! Or submit to keep your score safe.", "");
        } else {
            showMessage(gameMessage, "Waiting for setter to place boxes...", "");
        }
    } else {
        showMessage(gameMessage, "Waiting for another player to join...", "");
    }
    
    // Confirm Button (for Setter)
    if (myId === roomData.setter && selectedRed === 3 && selectedBomb === 1) {
        confirmBtn.style.display = "block";
    } else {
        confirmBtn.style.display = "none";
    }
    
    // Submit Button (for Guesser)
    if (myId === roomData.guesser && roomData.gameState === "guessing") {
        const hasUnopenedBoxes = roomData.boxes && roomData.boxes.some(b => b.content && !b.opened);
        const hasOpenedBoxes = roomData.boxes && roomData.boxes.some(b => b.opened);
        if (hasUnopenedBoxes && hasOpenedBoxes) {
            submitBtn.style.display = "block";
        } else {
            submitBtn.style.display = "none";
        }
    } else {
        submitBtn.style.display = "none";
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

// Turn submitted successfully
socket.on("turnSubmitted", (data) => {
    showMessage(gameMessage, `✓ Turn submitted! You kept your score of ${data.score} points.`, "success");
    submitBtn.style.display = "none";
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
