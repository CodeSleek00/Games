const socket = io();

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

// Join Room
joinBtn.addEventListener("click", () => {
  const name = nameInput.value.trim();
  const room = roomInput.value.trim();

  if (!name || !room) return alert("Enter Name and Room Code");

  roomCode = room;
  socket.emit("joinRoom", { room, name });
  statusText.innerText = "Waiting for another player...";
});

// Update players
socket.on("playersUpdate", players => {
  playersList.innerHTML = "";
  players.forEach(p => {
    const li = document.createElement("li");
    li.innerText = `${p.name} (${p.role}) - Score: ${p.score}`;
    playersList.appendChild(li);
    if (p.id === socket.id) role = p.role;
  });
});

// Game start
socket.on("gameStart", () => {
  document.querySelector(".lobby").style.display = "none";
  gameArea.style.display = "block";
  roleText.innerText = `You are the ${role}`;
});

// Drawing
canvas.onmousedown = () => { if(role==='drawer') drawing = true; };
canvas.onmouseup = () => { drawing = false; };
canvas.onmousemove = e => {
  if(!drawing || role!=='drawer') return;
  const x=e.offsetX, y=e.offsetY;
  ctx.fillRect(x,y,3,3);
  socket.emit("draw",{room:roomCode,x,y});
};

// Receive drawing
socket.on("draw", d => { ctx.fillRect(d.x,d.y,3,3); });

// Guessing
guessBtn.addEventListener("click", () => {
  const guess = guessInput.value.trim();
  if(!guess) return;
  socket.emit("checkGuess",{room:roomCode,guess});
  guessInput.value="";
});

// Round ended
socket.on("roundEnded", data => {
  alert(`Round Ended!\nWinner: ${data.winner}\nYour Score: ${role==='drawer'?data.drawerScore:data.guesserScore}`);
  ctx.clearRect(0,0,canvas.width,canvas.height);
});
