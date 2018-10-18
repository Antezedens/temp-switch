<?
header('Content-Type: text/html; charset=utf-8');
header('Access-Control-Allow-Origin: *');
require('db.php');

$id = $_GET['id'];
$unit_v = $_GET['unit'];
$unit2_v = $_GET['unit2'];

if (!$unit2_v) {
  $unit = $unit_v;
  $qu = "select unix_timestamp(tstamp)*1000 as ts, value from sensors where id='" . $id . "' and unit='$unit'";
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
  while($r = $result->fetch_row()) {
    //echo "$r[0] $r[1] $r[2] [[[$lastts] --> $lastvalue]]<br>";
    //echo ($r[2] == $id2) . " && " . ($r[0] == $lastts) . "<br>";
    if ($r[2] == $unit) {
      $lastts = $r[0];
      $lastvalue =  $r[1];  
    } else if ($r[2] == $unit2 && $r[0] == $lastts) {
      $r[2] = $lastvalue;
      if ($first) {
        $first = FALSE;
      } else {
        echo(",");
      }
      echo(json_encode($r, JSON_NUMERIC_CHECK));
    }      
  }
  echo("]");
  
}
?>