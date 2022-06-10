#!/bin/sh
cp poll.service /etc/systemd/system/
sudo systemctl --system daemon-reload
sudo systemctl enable poll
