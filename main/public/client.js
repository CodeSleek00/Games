const socket = io();
const boxesContainer = document.getElementById("boxesContainer");
const scoreboard = document.getElementById("scoreboard");
const roleInfo = document.getElementById("roleInfo");
const turnInfo = document.getElementById("turnInfo");
const roundInfo = document.getElementById("roundInfo");
const lobby = document.getElementById("lobby");
const gameArea = document.getElementById("gameArea");
const lobbyMsg = document.getElementById("lobbyMsg");
const joinBtn = document.getElementById("joinBtn");
const playerNameInput = document.getElementById("playerName");
const roomKeyInput = document.getElementById("roomKey");

let roomData = {};
let myId = null;

// Join room
joinBtn.onclick = ()=>{
    const name = playerNameInput.value.trim();
    const roomKey = roomKeyInput.value.trim();
    if(!name || !roomKey) return;
    socket.emit("joinRoom",roomKey,name,(res)=>{
        if(res.success){
            lobby.style.display="none";
            gameArea.style.display="block";
            myId = socket.id;
        }else{
            lobbyMsg.textContent=res.message;
        }
    });
};

// Render boxes
function renderBoxes(){
    boxesContainer.innerHTML="";
    roomData.boxes.forEach((box,idx)=>{
        const div = document.createElement("div");
        div.classList.add("box");
        if(box.opened){
            div.classList.add("opened");
            if(box.content==="green") div.style.background="#0f0";
            else if(box.content==="red") div.style.background="#f00";
            else if(box.content==="bomb") div.style.background="#000";
            div.textContent = box.content==="bomb" ? "💣" : box.content==="green" ? "✅" : "⚑";
        } else div.textContent="?";

        div.onclick = ()=>{
            if(myId===roomData.guesser && !box.opened){
                socket.emit("guessBox",idx);
            } else if(myId===roomData.setter && !box.opened){
                const content = prompt("Set box (red/bomb)").toLowerCase();
                if(["red","bomb"].includes(content)){
                    socket.emit("setBox",{index:idx,content:content});
                } else alert("Only Red or Bomb allowed!");
            }
        };
        boxesContainer.appendChild(div);
    });
}

// Render scoreboard
function renderScoreboard(){
    scoreboard.innerHTML="";
    Object.values(roomData.players).forEach(p=>{
        const li = document.createElement("li");
        li.textContent = `${p.name}: ${p.score}`;
        scoreboard.appendChild(li);
    });
}

// Update UI
function updateUI(){
    renderBoxes();
    renderScoreboard();
    roundInfo.textContent = `Round: ${roomData.round}/${roomData.maxRounds}`;
    if(myId===roomData.setter) roleInfo.textContent="Role: Box Setter (Select 3 Red + 1 Bomb)";
    else if(myId===roomData.guesser) roleInfo.textContent="Role: Guesser";
    else roleInfo.textContent="Role: Waiting";
    turnInfo.textContent = `Guesser: ${roomData.guesser?roomData.players[roomData.guesser].name:"-"}`;
}

// Listen server
socket.on("roomData",(data)=>{
    roomData = data;
    updateUI();
});
