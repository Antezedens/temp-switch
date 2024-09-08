#!/bin/bash
apt update
apt install python3-venv
python3 -m venv /root/.env/
/root/.env/bin/pip3 install flask
/root/.env/bin/pip3 install pytimeparse
/root/.env/bin/pip3 install gpiod
