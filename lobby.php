<!DOCTYPE html>
<html>
<head>
    <title>Game Lobby</title>
    <link rel="stylesheet" href="assets/style.css">
</head>
<body>

<div class="game">
    <h1>🎮 Draw & Guess Lobby</h1>

    <input type="text" id="room" placeholder="Room Code (e.g. 1234)">
    <br><br>

    <input type="text" id="name" placeholder="Your Name">
    <br><br>

    <button onclick="joinRoom()">Join Room</button>

    <p id="status">Waiting to join room...</p>

    <button id="startBtn" style="display:none;" onclick="startGame()">
        Start Game
    </button>
</div>

<script>
let joinedRoom = "";
let polling = null;

function joinRoom() {
    const name = document.getElementById("name").value.trim();
    const room = document.getElementById("room").value.trim();

    if (!name || !room) {
        alert("Enter name and room code");
        return;
    }

    joinedRoom = room;

    fetch("join.php", {
        method: "POST",
        headers: {"Content-Type":"application/x-www-form-urlencoded"},
        body: "name="+encodeURIComponent(name)+"&room="+encodeURIComponent(room)
    }).then(() => {
        document.getElementById("status").innerText =
            "⏳ Waiting for another player...";
        startPolling();
    });
}

function startPolling() {
    if (polling) return;

    polling = setInterval(() => {
        fetch("check_room.php?room="+encodeURIComponent(joinedRoom))
        .then(r => r.json())
        .then(data => {
            if (data.ready) {
                document.getElementById("status").innerText =
                    "✅ Both players joined!";
                document.getElementById("startBtn").style.display = "inline-block";
                clearInterval(polling);
            }
        });
    }, 1500);
}

function startGame() {
    window.location = "index.php?room=" + joinedRoom;
}
</script>

</body>
</html>
