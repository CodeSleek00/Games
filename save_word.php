<?php
session_start();
$_SESSION['word'] = strtolower(trim($_POST['word']));
?>