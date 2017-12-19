#!/bin/sh
cp web.service /etc/systemd/system/
sudo systemctl --system daemon-reload
sudo systemctl enable web
