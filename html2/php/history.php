<?
header('Content-Type: text/html; charset=utf-8');
header('Access-Control-Allow-Origin: *');
require('db.php');

$id = $_GET['id'];
$unit_v = $_GET['unit'];
$unit2_v = $_GET['unit2'];

$conn->query("SET time_zone = '+0:00';");

function printrow($first, $ts, $dat1, $dat2) {
  if (!$first) {
    echo(",");
  }
  echo "[$ts,$dat1,$dat2]";
  return FALSE;
}

if (!$unit2_v) {
  $unit = $unit_v;
  $qu = "select unix_timestamp(tstamp)*1000 as ts, value from sensors where id='" . $id . "' and unit='$unit' ORDER BY ts";
  $result = $conn->query($qu);
  if ($result === FALSE) {
    print "error with mysql" . $conn->error;
  }
  echo("[");
  echo(json_encode($result->fetch_row(), JSON_NUMERIC_CHECK));
  while($r = $result->fetch_row()) {
      echo(",");
      echo(json_encode($r, JSON_NUMERIC_CHECK));
  }
  echo("]");
} else {
  $unit = min($unit_v, $unit2_v);
  $unit2 = max($unit_v, $unit2_v);
  $qu = "select unix_timestamp(tstamp)*1000 as ts, value, unit from sensors where id='$id' and (unit='$unit' or unit='$unit2') ORDER BY ts,unit";
  $result = $conn->query($qu);
  if ($result === FALSE) {
    print "error with mysql" . $conn->error;
  }
  echo("[");
  $first = TRUE;
  $lastvalue = NULL;
  $lastvalue2 = NULL;
  $lastitem = -1;
  
  $lastrow = NULL;
  while($r = $result->fetch_row()) {
    //echo "$r[0] $r[1] $r[2] [[[$lastts] --> $lastvalue]]<br>";
    //echo ($r[2] == $id2) . " && " . ($r[0] == $lastts) . "<br>";
    if ($r[2] == $unit) {
      if (!is_null($lastvalue2) && !is_null($lastrow)) {
        $first = printrow($first, $lastrow[0], $lastrow[1], $lastvalue2);
      }
      $lastvalue =  $r[1];  
      $lastitem = 1;
      $lastrow = $r;
    } else if ($r[2] == $unit2) {
      if (!is_null($lastvalue)) {
        $first = printrow($first, $r[0], $lastvalue, $r[1]);
      }
      $lastvalue2 = $r[1];
      $lastrow = NULL;
    }      
  }
  echo("]");
  
}
?>