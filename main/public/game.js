const socket = io();

const joinBtn = document.getElementById("joinBtn");
const nameInput = document.getElementById("name");
const roomInput = document.getElementById("room");
const statusText = document.getElementById("status");

const gameArea = document.querySelector(".gameArea");
const canvas = document.getElementById("canvas");
const ctx = canvas.getContext("2d");
const roleText = document.getElementById("roleText");
const roundText = document.getElementById("roundText");
const timerText = document.getElementById("timerText");
const guessInput = document.getElementById("guess");
const guessBtn = document.getElementById("guessBtn");
const playersList = document.getElementById("playersList");
const messages = document.getElementById("messages");

let drawing = false;
let role = "";
let roomCode = "";

// Join Room
joinBtn.addEventListener("click", () => {
  const name = nameInput.value.trim();
  const room = roomInput.value.trim();
  if(!name||!room) return alert("Enter Name and Room Code");
  roomCode = room;
  socket.emit("joinRoom",{room,name});
  statusText.innerText = "Waiting for another player...";
});

// Players update
socket.on("playersUpdate", players => {
  playersList.innerHTML = "";
  players.forEach(p=>{
    const li=document.createElement("li");
    li.innerText=`${p.name} (${p.role}) - Score: ${p.score}`;
    playersList.appendChild(li);
    if(p.id===socket.id) role=p.role;
  });
  roleText.innerText=`You are the ${role}`;
});

// Round start
socket.on("newRound", data => {
  roundText.innerText = `Round ${data.round}`;
  timerText.innerText = `Time: ${data.remainingTime}`;
  messages.innerText = `New round started! ${role==='drawer'?'Draw the name':'Guess the name'}`;
  ctx.clearRect(0,0,canvas.width,canvas.height);
});

// Timer update
socket.on("timerUpdate", t => { timerText.innerText=`Time: ${t}`; });

// Drawing
canvas.onmousedown=()=>{if(role==='drawer') drawing=true;};
canvas.onmouseup=()=>{drawing=false;};
canvas.onmousemove=e=>{
  if(!drawing||role!=='drawer') return;
  const x=e.offsetX, y=e.offsetY;
  ctx.fillRect(x,y,3,3);
  socket.emit("draw",{room:roomCode,x,y});
};
socket.on("draw",d=>{ctx.fillRect(d.x,d.y,3,3);});

// Guessing
guessBtn.addEventListener("click",()=>{
  const guess=guessInput.value.trim();
  if(!guess) return;
  socket.emit("checkGuess",{room:roomCode,guess});
  guessInput.value="";
});

// Round ended
socket.on("roundEnded", data => {
  if(data.winner){
    messages.innerText=`Round Ended! Winner: ${data.winner}. You got ${role==='drawer'?data.drawerPoints:data.guesserPoints} points!`;
  } else {
    messages.innerText="Time over! Round ended!";
  }
  ctx.clearRect(0,0,canvas.width,canvas.height);
});
