const socket = io("https://your-backend-url");

let roomCode = "";
const canvas = document.getElementById("canvas");
const ctx = canvas.getContext("2d");
let drawing = false;

function join() {
  roomCode = room.value;
  socket.emit("joinRoom", { room: roomCode, name: name.value });
  status.innerText = "Waiting for player...";
}

socket.on("startGame", () => {
  status.innerText = "Game Started!";
});

canvas.onmousedown = () => drawing = true;
canvas.onmouseup = () => drawing = false;
canvas.onmousemove = e => {
  if (!drawing) return;
  ctx.fillRect(e.offsetX, e.offsetY, 3, 3);
  socket.emit("draw", { x: e.offsetX, y: e.offsetY, room: roomCode });
};

socket.on("draw", d => {
  ctx.fillRect(d.x, d.y, 3, 3);
});
