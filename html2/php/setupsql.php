<? 
$servername = "localhost";
$username = "db";
$password = "SD#^^5cY2y%R";
$db = "home";

$conn = new mysqli($servername, $username, $password, $db);

// Check connection
if ($conn->connect_error) {
    die("Connection failed: " . $conn->connect_error);
} 
echo "Connected successfully";

if (TRUE === $conn->query("CREATE TABLE sensors (tstamp datetime, id int(3), value float(2), primary key (tstamp, id))")) {
  echo "Database created successfully";
} else {
  echo "Error creating database: " . $conn->error;
}

?>
