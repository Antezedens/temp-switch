<?
header('Content-Type: text/html; charset=utf-8');
header('Access-Control-Allow-Origin: *');
require('db.php');

$qu = "select unix_timestamp(tstamp)*1000 as ts, value from sensors where id='" . $_GET['id'] . "' and unit='" . $_GET['unit'] . "'";
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
?>