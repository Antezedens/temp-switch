<?

require('db.php');

$qu = "INSERT INTO sensors VALUES ";
$data = json_decode(file_get_contents('php://input'), true); //json_decode($_POST['data']);
$comma = false;
foreach($data as $entry) {
  if ($comma) {
    $qu .= ",";
  } else {
    $comma = true;
  }
  $qu .= "('" . $entry[0] . "'," . ($entry[1]%100) . "," . floor($entry[1]/100) . "," . $entry[2] . ")";
}
$qu .= ';';

if (TRUE === $conn->query($qu)) {
  echo "Entries added ok $qu";
} else {
  echo "Error adding values: " . $conn->error;
  echo "<pre>";
  print_r($_POST);
  echo "</pre>";
  echo "<pre>" . $data . "</pre>";
  echo "<pre>" . $qu . "</pre>";
}

?>
