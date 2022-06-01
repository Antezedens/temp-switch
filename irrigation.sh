#!/bin/bash
cd ${0%%irrigation.sh}

#1 huette
#2 pool
#####3 stiege
#4 flaeche
#5 grillplatz
#####6 böschung

alla=$@

gpio=$1
minutes=${alla##$1 } 
echo "irrigation params: gpio $gpio: $minutes ('$alla')"

#for i in 5 6m 170 6m 8m 9m ; do
for i in $minutes ; do
	./setrelais2.sh $gpio 0
	echo "irrigation for $i"
	sleep $i
	./setrelais2.sh $gpio 1
	sleep 60
done

./setrelais2.sh $gpio 1
