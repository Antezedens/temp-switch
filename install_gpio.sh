#!/bin/sh
cp gpio.service /etc/systemd/system/
sudo systemctl --system daemon-reload
sudo systemctl enable web
