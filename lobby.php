<!DOCTYPE html>
<html>
<head>
    <title>Draw & Guess Game – Lobby</title>
    <link rel="stylesheet" href="assets/style.css">
</head>
<body>

<div class="game">
    <h1>🎮 Draw & Guess Lobby</h1>

    <!-- Room Code -->
    <input type="text" id="room" placeholder="Create / Enter Room Code (e.g. 1234)">
    <br><br>

    <!-- Player Name -->
    <input type="text" id="name" placeholder="Enter Your Name">
    <br><br>

    <!-- Join Button -->
    <button onclick="joinRoom()">Join Room</button>

    <!-- Status -->
    <p id="status" style="margin-top:15px;"></p>

    <!-- Start Game -->
    <button id="startBtn" style="display:none;" onclick="startGame()">
        Start Game
    </button>
</div>

<script>
let joinedRoom = "";

function joinRoom() {
    const name = document.getElementById("name").value.trim();
    const room = document.getElementById("room").value.trim();

    if (name === "" || room === "") {
        alert("Please enter both Name and Room Code");
        return;
    }

    fetch("join.php", {
        method: "POST",
        headers: { "Content-Type": "application/x-www-form-urlencoded" },
        body: "name=" + encodeURIComponent(name) + "&room=" + encodeURIComponent(room)
    })
    .then(res => res.json())
    .then(data => {
        document.getElementById("status").innerText = data.msg;
        joinedRoom = room;

        /* Show start button only when room is full */
        if (data.ready) {
            document.getElementById("startBtn").style.display = "inline-block";
        }
    });
}

function startGame() {
    if (joinedRoom === "") {
        alert("Join a room first");
        return;
    }
    window.location.href = "index.php?room=" + joinedRoom;
}
</script>

</body>
</html>
