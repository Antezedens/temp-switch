#!/bin/sh
HOST='fuchsbau.cu.ma'
USER='fuchsba1'
PASSWD='fD3*6)YCn93hxM'

ftp -n $HOST <<END_SCRIPT
quote USER $USER
quote PASS $PASSWD
cd public_html
put setupsql.php
put sensor.php
put history.php
put db.php
put relais.php
put current.php
put index.html
quit
END_SCRIPT
exit 0
