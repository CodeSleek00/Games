const socket = io();
const canvas = document.getElementById("canvas");
const ctx = canvas.getContext("2d");
let drawing = false;
let roomCode = "";

function join() {
  const room = document.getElementById("room").value;
  const name = document.getElementById("name").value;
  roomCode = room;

  socket.emit("joinRoom", { room, name });
  document.getElementById("status").innerText = "Waiting for player...";
}

socket.on("gameReady", () => {
  document.getElementById("status").innerText = "Game Started!";
});

canvas.onmousedown = () => drawing = true;
canvas.onmouseup = () => drawing = false;
canvas.onmousemove = (e) => {
  if (!drawing) return;
  ctx.fillRect(e.offsetX, e.offsetY, 3, 3);
  socket.emit("draw", { x: e.offsetX, y: e.offsetY, room: roomCode });
};

socket.on("draw", (data) => {
  ctx.fillRect(data.x, data.y, 3, 3);
});

function sendGuess() {
  const guess = document.getElementById("guess").value;
  socket.emit("guess", { room: roomCode, guess });
}

socket.on("guess", (guess) => {
  alert("Opponent guessed: " + guess);
});
