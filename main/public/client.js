const socket = io();
const canvas = document.getElementById("gameCanvas");
const ctx = canvas.getContext("2d");

let players = {};
let speed = 5;

// Listen to player updates
socket.on("players", (data) => {
    players = data;
    drawPlayers();
});

function drawPlayers() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    for(let id in players){
        let p = players[id];
        // Draw player circle
        ctx.fillStyle = p.color;
        ctx.beginPath();
        ctx.arc(p.x, p.y, 20, 0, Math.PI*2);
        ctx.fill();

        // Draw name
        ctx.fillStyle = "#fff";
        ctx.font = "14px Arial";
        ctx.fillText(p.name, p.x - 20, p.y - 25);

        // Draw score
        ctx.fillStyle = "#0f0";
        ctx.fillText("Score: " + p.score, p.x - 20, p.y + 35);
    }
}

// Movement
document.addEventListener("keydown", (e) => {
    let dx=0, dy=0;
    if(e.key === "ArrowUp") dy = -speed;
    if(e.key === "ArrowDown") dy = speed;
    if(e.key === "ArrowLeft") dx = -speed;
    if(e.key === "ArrowRight") dx = speed;

    socket.emit("move", {dx, dy});
});
