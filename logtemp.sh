#!/bin/sh
cd ${0%%logtemp.sh}
NODE=$(cat node.txt)
node logtemp${NODE}.js
