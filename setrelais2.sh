#!/bin/sh
logger Wasser $2
echo $2 > /sys/class/gpio/gpio$1/value
