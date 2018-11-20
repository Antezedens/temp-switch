<?

require('db.php');

$qu = "INSERT INTO sensors VALUES ";
$data = json_decode(file_get_contents('php://input'), true); //json_decode($_POST['data']);
$comma = false;
$relais = [];
foreach($data as $entry) {
  if ($comma) {
    $qu .= ",";
  } else {
    $comma = true;
  }
  $qu .= "('" . $entry[0] . "'," . ($entry[1]%100) . "," . floor($entry[1]/100) . "," . $entry[2] . ")";
  if (count($entry) > 3) {
    $relais[$entry[1]] = $entry[3];
  }
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

function orNull($string) {
  if ($string == '') {
    return NULL;
  }
  return $string;
}

foreach($relais as $key => $value) {
  $qu = "UPDATE relais SET turnon = '" . orNull($value.turnon) . "', turnoff = '" . orNull($value.turnoff) . "' WHERE id = '" . $value.id . "' ";
  if (TRUE === $conn->query($qu)) {
    echo "Relais update ok $qu";
  } else {
    echo "Error updating relais: " . $conn->error;
    echo "<pre>";
    print_r($_POST);
    echo "</pre>";
    echo "<pre>";
    print_r($value);
    echo "</pre>";
    echo "<pre>" . $data . "</pre>";
    echo "<pre>" . $qu . "</pre>";
  }
}

?>
