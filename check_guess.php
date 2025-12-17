<?php
session_start();
$guess = strtolower(trim($_POST['guess']));
$time = intval($_POST['time']);


$_SESSION['p1'] = $_SESSION['p1'] ?? 0;
$_SESSION['p2'] = $_SESSION['p2'] ?? 0;


if ($guess === $_SESSION['word']) {
$guessPoints = 50 + $time;
$drawPoints = 30 + intval($time/2);


$_SESSION['p1'] += $drawPoints;
$_SESSION['p2'] += $guessPoints;


echo json_encode([
"msg" => "✅ Correct Guess!",
"p1" => $_SESSION['p1'],
"p2" => $_SESSION['p2']
]);
} else {
echo json_encode([
"msg" => "❌ Wrong Guess",
"p1" => $_SESSION['p1'],
"p2" => $_SESSION['p2']
]);
}