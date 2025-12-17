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
const confirmBtn = document.getElementById("confirmBtn");
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

// Track selection for setter
let selectedRed=0;
let selectedBomb=0;

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
            if(myId===roomData.setter && !box.opened && !box.content){
                if(selectedRed<3){
                    box.content="red";
                    selectedRed++;
                } else if(selectedBomb<1){
                    box.content="bomb";
                    selectedBomb++;
                } else return;
                socket.emit("setBox",{index:idx,content:box.content});
            } else if(myId===roomData.guesser && !box.opened && box.content){
                socket.emit("guessBox",idx);
            }
        };
        boxesContainer.appendChild(div);
    });

    if(myId===roomData.setter && selectedRed===3 && selectedBomb===1){
        confirmBtn.style.display="inline-block";
    } else {
        confirmBtn.style.display="none";
    }
}

// Confirm setter boxes
confirmBtn.onclick = ()=>{
    socket.emit("confirmBoxes");
};

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
    if(myId===roomData.setter) roleInfo.textContent="Role: Box Setter (Click 3 Red + 1 Bomb)";
    else if(myId===roomData.guesser) roleInfo.textContent="Role: Guesser";
    else roleInfo.textContent="Role: Waiting";
    turnInfo.textContent = `Guesser: ${roomData.guesser?roomData.players[roomData.guesser].name:"-"}`;
}

// Listen server
socket.on("roomData",(data)=>{
    roomData = data;
    updateUI();
});

// Start guessing after confirm
socket.on("startGuessing",()=>{
    alert("Setter confirmed! Guesser can start guessing.");
});
