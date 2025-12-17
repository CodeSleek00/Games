let canvas = document.getElementById("board");
let ctx = canvas.getContext("2d");
let drawing = false;
let time = 60;
let timer;
let currentPlayer = 1;


canvas.onmousedown = () => drawing = true;
canvas.onmouseup = () => drawing = false;
canvas.onmousemove = draw;


function draw(e) {
if (!drawing) return;
ctx.fillStyle = "black";
ctx.beginPath();
ctx.arc(e.offsetX, e.offsetY, 4, 0, Math.PI * 2);
ctx.fill();
}


function startRound() {
let word = document.getElementById("secretWord").value;
if (!word) return alert("Enter a word");


fetch("save_word.php", {
method: "POST",
headers: { "Content-Type": "application/x-www-form-urlencoded" },
body: "word=" + word
});


ctx.clearRect(0,0,canvas.width,canvas.height);
time = 60;
document.getElementById("time").innerText = time;


timer = setInterval(() => {
time--;
document.getElementById("time").innerText = time;
if (time <= 0) clearInterval(timer);
},1000);
}


function submitGuess() {
let guess = document.getElementById("guess").value;


fetch("check_guess.php", {
method: "POST",
headers: { "Content-Type": "application/x-www-form-urlencoded" },
body: "guess=" + guess + "&time=" + time
})
.then(res => res.json())
.then(data => {
document.getElementById("msg").innerText = data.msg;
document.getElementById("p1").innerText = data.p1;
document.getElementById("p2").innerText = data.p2;
clearInterval(timer);
});
}