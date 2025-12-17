<?php
session_start();
if (!isset($_SESSION['players'])) {
    $_SESSION['players'] = [];
}
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

    <input type="text" id="name" placeholder="Enter your name">
    <br><br>
    <button onclick="joinGame()">Join Game</button>

    <p id="status"></p>

    <button id="startBtn" style="display:none;" onclick="startGame()">
        Start Game
    </button>
</div>

<script>
function joinGame() {
    let name = document.getElementById("name").value;
    if(name === "") {
        alert("Enter your name");
        return;
    }

    fetch("join.php", {
        method: "POST",
        headers: { "Content-Type": "application/x-www-form-urlencoded" },
        body: "name=" + name
    })
    .then(res => res.json())
    .then(data => {
        document.getElementById("status").innerText = data.msg;
        if (data.ready) {
            document.getElementById("startBtn").style.display = "inline-block";
        }
    });
}

function startGame() {
    window.location = "index.php";
}
</script>

</body>
</html>
