<?php
header('Content-Type: application/json');

$room = $_GET['room'] ?? '';
if ($room == '') {
    echo json_encode(['ready'=>false]);
    exit;
}

$data = json_decode(file_get_contents("rooms.json"), true);

if (isset($data[$room]) && count($data[$room]) == 2) {
    echo json_encode([
        'ready' => true,
        'players' => $data[$room]
    ]);
} else {
    echo json_encode(['ready'=>false]);
}
