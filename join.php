<?php
session_start();

/* Initialize players array */
if (!isset($_SESSION['players'])) {
    $_SESSION['players'] = [];
}

$name = trim($_POST['name'] ?? "");

/* Validate name */
if ($name == "") {
    echo json_encode([
        "msg" => "❌ Name cannot be empty",
        "ready" => false
    ]);
    exit;
}

/* Allow only 2 players */
if (count($_SESSION['players']) < 2) {
    if (!in_array($name, $_SESSION['players'])) {
        $_SESSION['players'][] = $name;
    }
}

/* Check if lobby is full */
$ready = (count($_SESSION['players']) === 2);

echo json_encode([
    "msg" => $ready 
        ? "✅ Both players joined. You can start the game!" 
        : "⏳ Waiting for another player...",
    "ready" => $ready,
    "players" => $_SESSION['players']
]);
