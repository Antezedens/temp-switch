<?
$servername = "localhost";
$username = "db";
$password = "SD#^^5cY2y%R";
$db = "home";

$conn = new mysqli($servername, $username, $password, $db);
if (!$conn->set_charset('utf8')) {
	die("error loading character set: " . $mysqli->error);
}

// Check connection
if ($conn->connect_error) {
    die("Connection failed: " . $conn->connect_error);
} 

?>
