const socket = io(); // Socket.io connection

// Elements
const joinBtn = document.getElementById("joinBtn");
const nameInput = document.getElementById("name");
const roomInput = document.getElementById("room");
const statusText = document.getElementById("status");

const gameArea = document.querySelector(".gameArea");
const canvas = document.getElementById("canvas");
const ctx = canvas.getContext("2d");
const roleText = document.getElementById("roleText");
const guessInput = document.getElementById("guess");
const guessBtn = document.getElementById("guessBtn");
const playersList = document.getElementById("playersList");

let drawing = false;
let role = "";
let roomCode = "";
let myId = "";

// Join Room
joinBtn.addEventListener("click", () => {
  const name = nameInput.value.trim();
  const room = roomInput.value.trim();

  if (!name || !room) {
    alert("Enter Name and Room Code");
    return;
  }

  roomCode = room;
  socket.emit("joinRoom", { room, name });
  statusText.innerText = "Waiting for another player...";
});

// Receive player updates
socket.on("playersUpdate", players => {
  playersList.innerHTML = "";
  players.forEach(p => {
    const li = document.createElement("li");
    li.innerText = `${p.name} (${p.role}) - Score: ${p.score}`;
    playersList.appendChild(li);
    if (p.id === socket.id) {
      role = p.role;
      myId = p.id;
    }
  });
});

// Game Start
socket.on("gameStart", () => {
  statusText.style.display = "none";
  document.querySelector(".lobby").style.display = "none";
  gameArea.style.display = "block";
  roleText.innerText = `You are the ${role}`;
});

// Drawing logic (only drawer can draw)
canvas.onmousedown = () => {
  if (role !== "drawer") return;
  drawing = true;
};
canvas.onmouseup = () => {
  drawing = false;
};
canvas.onmousemove = e => {
  if (!drawing || role !== "drawer") return;
  const x = e.offsetX;
  const y = e.offsetY;
  ctx.fillRect(x, y, 3, 3);
  socket.emit("draw", { room: roomCode, x, y });
};

// Receive drawing
socket.on("draw", data => {
  ctx.fillRect(data.x, data.y, 3, 3);
});

// Send guess
guessBtn.addEventListener("click", () => {
  const guess = guessInput.value.trim();
  if (!guess) return;
  socket.emit("guess", { room: roomCode, guess });
  guessInput.value = "";
});

// Receive guess
socket.on("guess", data => {
  const player = playersList.querySelector(`li:contains('${data.playerId}')`);
  alert(`Opponent guessed: ${data.guess}`);
});
