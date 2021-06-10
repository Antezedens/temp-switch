#!/bin/bash

while true ; do
	./setrelais.sh 58 1
	echo "skip..."
	echo "perlschlauch type y for yes?"
	read x
	./setrelais.sh 58 0
	if [ "x" == "y" ] ; then 
		exit 0
	fi
	sleep 45
done
