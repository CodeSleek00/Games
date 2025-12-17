const socket = io();
const boxesContainer = document.getElementById("boxesContainer");
const scoreboard = document.getElementById("scoreboard");
const turnInfo = document.getElementById("turnInfo");

let boxes = [];
let players = {};
let myId = null;
let currentTurn = null;

// Generate boxes visually
function renderBoxes() {
    boxesContainer.innerHTML = "";
    boxes.forEach((box, idx) => {
        const div = document.createElement("div");
        div.classList.add("box");
        if(box.opened) div.classList.add("opened");
        div.textContent = box.opened ? box.content || "Empty" : "?";
        div.onclick = () => {
            if(!box.opened && myId === currentTurn){
                socket.emit("guessBox", idx);
            }
        };
        boxesContainer.appendChild(div);
    });
}

// Update scoreboard
function renderScoreboard() {
    scoreboard.innerHTML = "";
    Object.values(players).forEach(p => {
        const li = document.createElement("li");
        li.textContent = `${p.name}: ${p.score}`;
        scoreboard.appendChild(li);
    });
}

// Listen to server updates
socket.on("players", (data) => {
    players = data;
    renderScoreboard();
    if(!myId) myId = socket.id;
});

socket.on("boxes", (data) => {
    boxes = data;
    renderBoxes();
});

socket.on("turn", (id) => {
    currentTurn = id;
    const name = players[id] ? players[id].name : "Unknown";
    turnInfo.textContent = `🎯 Turn: ${name}`;
});

// Optional: Set treasure (for testing purposes)
window.addEventListener("load", () => {
    if(myId){
        boxes.forEach((b, idx) => {
            if(!b.content){
                const content = prompt(`Set treasure for box ${idx+1} (your name will do)`,"Treasure") || "";
                socket.emit("setTreasure", {index: idx, content});
            }
        });
    }
});
