const socket = io();
const boxesContainer = document.getElementById("boxesContainer");
const scoreboard = document.getElementById("scoreboard");
const turnInfo = document.getElementById("turnInfo");

let boxes = [];
let players = {};
let myId = null;
let currentTurn = null;

// Render boxes
function renderBoxes() {
    boxesContainer.innerHTML = "";
    boxes.forEach((box, idx) => {
        const div = document.createElement("div");
        div.classList.add("box");
        if(box.opened) {
            div.classList.add("opened");
            if(box.content === "green") div.style.background = "#0f0";
            if(box.content === "red") div.style.background = "#f00";
            if(box.content === "bomb") div.style.background = "#000";
            div.textContent = box.content === "bomb" ? "💣" : box.content === "green" ? "✅" : "⚑";
        } else {
            div.textContent = "?";
        }

        div.onclick = () => {
            if(!box.opened && myId === currentTurn){
                socket.emit("guessBox", idx);
            }
        };
        boxesContainer.appendChild(div);
    });
}

// Render scoreboard
function renderScoreboard() {
    scoreboard.innerHTML = "";
    Object.values(players).forEach(p => {
        const li = document.createElement("li");
        li.textContent = `${p.name}: ${p.score}`;
        scoreboard.appendChild(li);
    });
}

// Listen to server
socket.on("players", (data) => {
    players = data;
    if(!myId) myId = socket.id;
    renderScoreboard();
});

socket.on("boxes", (data) => {
    boxes = data;
    renderBoxes();
});

socket.on("turn", (id) => {
    currentTurn = id;
    const name = players[id] ? players[id].name : "Unknown";
    turnInfo.textContent = `🎯 Current Turn: ${name}`;
});
