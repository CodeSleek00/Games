<?php
session_start();

$name = trim($_POST['name'] ?? '');
$room = trim($_POST['room'] ?? '');

if($name == "" || $room == ""){
    echo json_encode([
        "msg" => "❌ Name or Room Code missing",
        "ready" => false
    ]);
    exit;
}

/* Create room if not exists */
if(!isset($_SESSION['rooms'])){
    $_SESSION['rooms'] = [];
}

if(!isset($_SESSION['rooms'][$room])){
    $_SESSION['rooms'][$room] = [];
}

/* Max 2 players per room */
if(count($_SESSION['rooms'][$room]) < 2){
    if(!in_array($name, $_SESSION['rooms'][$room])){
        $_SESSION['rooms'][$room][] = $name;
    }
}

$ready = count($_SESSION['rooms'][$room]) == 2;

/* Save user's room */
$_SESSION['current_room'] = $room;

echo json_encode([
    "msg" => $ready 
        ? "✅ Room full! Start the game"
        : "⏳ Waiting for another player...",
    "ready" => $ready,
    "players" => $_SESSION['rooms'][$room]
]);
