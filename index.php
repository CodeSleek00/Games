<?php
session_start();

$room = $_GET['room'] ?? '';
if ($room == '') {
    header("Location: lobby.php");
    exit;
}

/* Read rooms */
$rooms = json_decode(file_get_contents("rooms.json"), true);

/* Room validation */
if (!isset($rooms[$room]) || count($rooms[$room]) < 2) {
    echo "<h2>Waiting for another player to join room $room...</h2>";
    exit;
}

/* Initialize score file */
$scoreFile = "scores_$room.json";
if (!file_exists($scoreFile)) {
    file_put_contents($scoreFile, json_encode([
        "p1" => 0,
        "p2" => 0
    ]));
}

$scores = json_decode(file_get_contents($scoreFile), true);
?>
<!DOCTYPE html>
<html>
<head>
    <title>Draw & Guess Game</title>
    <link rel="stylesheet" href="assets/style.css">
</head>
<body>

<div class="game">
    <h1>🎨 Draw & Guess Game</h1>
    <h3>Room Code: <?= htmlspecialchars($room) ?></h3>

    <div class="scoreboard">
        <div><?= $rooms[$room][0]; ?> :
            <span id="p1"><?= $scores['p1']; ?></span>
        </div>
        <div><?= $rooms[$room][1]; ?> :
            <span id="p2"><?= $scores['p2']; ?></span>
        </div>
    </div>

    <div class="timer">
        ⏱ Time Left: <span id="time">60</span>s
    </div>

    <!-- Secret Word -->
    <div class="word-box">
        <input type="password" id="secretWord" placeholder="Enter secret word">
        <button onclick="startRound()">Start Drawing</button>
    </div>

    <!-- Canvas -->
    <canvas id="board" width="600" height="350"></canvas>

    <!-- Guess -->
    <div class="guess-box">
        <input type="text" id="guess" placeholder="Guess the word">
        <button onclick="submitGuess()">Guess</button>
    </div>

    <p id="msg"></p>
</div>

<script>
const ROOM = "<?= $room ?>";
</script>
<script src="assets/script.js"></script>
</body>
</html>
