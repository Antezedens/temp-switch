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
quit
END_SCRIPT
exit 0
