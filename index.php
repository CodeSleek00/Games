<?php
session_start();

/* Security check */
if (!isset($_SESSION['players']) || count($_SESSION['players']) < 2) {
    header("Location: lobby.php");
    exit;
}

/* Initialize scores */
$_SESSION['score1'] = $_SESSION['score1'] ?? 0;
$_SESSION['score2'] = $_SESSION['score2'] ?? 0;
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

    <div class="scoreboard">
        <div><?= $_SESSION['players'][0]; ?> :
            <span id="p1"><?= $_SESSION['score1']; ?></span>
        </div>
        <div><?= $_SESSION['players'][1]; ?> :
            <span id="p2"><?= $_SESSION['score2']; ?></span>
        </div>
    </div>

    <div class="timer">
        ⏱ Time Left: <span id="time">60</span>s
    </div>

    <!-- Secret word -->
    <div class="word-box">
        <input type="password" id="secretWord" placeholder="Enter secret word">
        <button onclick="startRound()">Start Drawing</button>
    </div>

    <!-- Drawing board -->
    <canvas id="board" width="600" height="350"></canvas>

    <!-- Guess section -->
    <div class="guess-box">
        <input type="text" id="guess" placeholder="Guess the word">
        <button onclick="submitGuess()">Guess</button>
    </div>

    <p id="msg"></p>
</div>

<script src="assets/script.js"></script>
</body>
</html>
