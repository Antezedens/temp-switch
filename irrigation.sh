#!/bin/bash
cd ${0%%irrigation.sh}

#1 huette
#2 pool
#####3 stiege
#4 flaeche
#5 grillplatz
#####6 böschung

alla=$@
echo "irrigation params: '$alla'"

if [ "$1" != "" ] && [ "$2" != "" ] && [ "$3" != "" ] && [ "$4" != "" ] && [ "$5" != "" ] && [ "$6" != "" ] ; then
	minutes="$1 $2 $3 $4 $5 $6"
elif [ "${alla##force}" != "$alla" ] ; then
	minutes="${alla##force}"
else
	minutes="1m 1m 1m 1m"
fi	

#for i in 5 6m 170 6m 8m 9m ; do
for i in $minutes ; do
	./setrelais2.sh 198 0
	echo "irrigation for $i"
	sleep $i
	./setrelais2.sh 198 1
	sleep 60
done
