<?php session_start(); ?>
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
<div>Player 1: <span id="p1">0</span></div>
<div>Player 2: <span id="p2">0</span></div>
</div>


<div class="timer">Time Left: <span id="time">60</span>s</div>


<div class="word-box">
<input type="password" id="secretWord" placeholder="Enter secret word">
<button onclick="startRound()">Start Drawing</button>
</div>


<canvas id="board" width="600" height="350"></canvas>


<div class="guess-box">
<input type="text" id="guess" placeholder="Guess the word">
<button onclick="submitGuess()">Guess</button>
</div>


<p id="msg"></p>
</div>


<script src="assets/script.js"></script>
</body>
</html>