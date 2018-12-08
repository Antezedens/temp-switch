<?
header('Content-Type: text/html; charset=utf-8');
header('Access-Control-Allow-Origin: *');
require('db.php');

$qu = "select s.id, s.value, src.name, u.name as unit, s.unit as unitid, (unix_timestamp(s.tstamp)*1000) as tstamp
from (
   select id, unit, max(tstamp) as latest
   from sensors group by id,unit
) as x inner join sensors as s on s.id = x.id and s.unit = x.unit and s.tstamp = x.latest inner join sources as src on s.id = src.id inner join Unit as u on u.id = s.unit";
$result = $conn->query($qu);
$rows = array();
while($r = $result->fetch_assoc()) {
    $rows[] = $r;
}
print json_encode($rows, JSON_NUMERIC_CHECK);
?>