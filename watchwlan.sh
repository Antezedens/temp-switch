while true ; do
ping -c 1 8.8.8.8 > /dev/null && date "+%H:%M:%S up" >> /tmp/wlanup.txt || date "+%H:%M:%S down" >> /tmp/wlanup.txt
sleep 30
done
