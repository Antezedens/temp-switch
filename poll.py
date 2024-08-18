#!/usr/bin/env python3

from datetime import timedelta
import gpiod
from gpiod.line import Direction, Value, Edge, Bias
import requests
import subprocess

CHIP = 0
LINE_OFFSET = 1 # 6

#led = c.get_line(LED_LINE_OFFSET)

button = gpiod.request_lines(
    "/dev/gpiochip%d" % CHIP,
    consumer="poll.py",
    config = {
        LINE_OFFSET: gpiod.LineSettings(
            direction=Direction.INPUT,
            edge_detection = Edge.BOTH,
            bias = Bias.PULL_UP,
        )
    },
)

while True:
    if button.wait_edge_events(timedelta(seconds=600)):
        # event_read() is blocking function.
        event = button.read_edge_events()
        if button.get_value(LINE_OFFSET) == Value.INACTIVE:
            if button.wait_edge_events(timedelta(milliseconds=400)):
                subprocess.run(["logger", "button pressed not long enough"])
            else:
                subprocess.run(["logger", "button pressed for 0.4s"])
                #requests.get('http://localhost:5000/toggle_irrigation?pin=19,198&times=15s')
                requests.post('http://10.5.5.20:8080/rest/items/toggle_watersupply_pool', data="ON", headers={'Content-Type': 'text/plain'})
                #requests.get('http://localhost:5000/toggle_irrigation?pin=198&times=70s')
        else:
            subprocess.run(["logger", "button pressed: rising edge"])
