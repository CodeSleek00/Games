<?php
session_start();
?>
<!DOCTYPE html>
<html>
<head>
    <title>Game Lobby</title>
    <link rel="stylesheet" href="assets/style.css">
</head>
<body>

<div class="game">
    <h1>🎮 Draw & Guess Lobby</h1>

    <input type="text" id="room" placeholder="Enter Room Code (e.g. 1234)">
    <br><br>
    <input type="text" id="name" placeholder="Enter Your Name">
    <br><br>

    <button onclick="joinRoom()">Join Room</button>

    <p id="status"></p>

    <button id="startBtn" style="display:none;" onclick="startGame()">
        Start Game
    </button>
</div>

<script>
function joinRoom() {
    let name = document.getElementById("name").value;
    let room = document.getElementById("room").value;

    if(name === "" || room === ""){
        alert("Enter name and room code");
        return;
    }

    fetch("join.php", {
        method: "POST",
        headers: { "Content-Type": "application/x-www-form-urlencoded" },
        body: "name=" + name + "&room=" + room
    })
    .then(res => res.json())
    .then(data => {
        document.getElementById("status").innerText = data.msg;
        if(data.ready){
            document.getElementById("startBtn").style.display = "inline-block";
        }
    });
}

function startGame(){
    window.location = "index.php";
}
</script>

</body>
</html>
