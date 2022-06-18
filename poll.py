#!/usr/bin/env python3

import sys
from datetime import timedelta, datetime
from gpiod import chip, line_request, line_event
import requests
import time
import subprocess

CHIP = 0
LINE_OFFSET = 1 # 6
#LED_LINE_OFFSET = 198
EDGE = line_request.EVENT_BOTH_EDGES

c = chip(CHIP)
button = c.get_line(LINE_OFFSET)
#led = c.get_line(LED_LINE_OFFSET)

config = line_request()
config.consumer = "Button"
config.request_type = EDGE
config.flags = line_request.FLAG_BIAS_PULL_UP

#ledreq = line_request()
#ledreq.consumer = "LED"
#ledreq.request_type = line_request.DIRECTION_OUTPUT

button.request(config)
#led.request(ledreq)

#while True:
#    led.set_value(0)
#    time.sleep(0.3)
#    led.set_value(1)
#    time.sleep(0.3)

#requests.get('http://localhost:5000/toggle_irrigation?pin=198,199&times=60m')

while True:
    if button.event_wait(timedelta(seconds=600)):
        # event_read() is blocking function.
        event = button.event_read()
        if button.get_value() == 0:
            if button.event_wait(timedelta(milliseconds=400)):
                subprocess.run(["logger", "button pressed not long enough"])
            else:
                subprocess.run(["logger", "button pressed for 0.4s"])
                #requests.get('http://localhost:5000/toggle_irrigation?pin=19,198&times=15s')
                requests.get('http://localhost:5000/toggle_irrigation?pin=198&times=70s')
        else:
            subprocess.run(["logger", "button pressed: rising edge"])
