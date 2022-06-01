import sys
from datetime import timedelta
from .. import chip, line_request, line_event
import requests

CHIP = 0
LINE_OFFSET = 13
EDGE = line_request.EVENT_FALLING_EDGE

c = chip(CHIP)
button = c.get_line(LINE_OFFSET)

config = line_request()
config.consumer = "Button"
config.request_type = EDGE
config.flags = line_request.FLAG_BIAS_PULL_UP

button.request(config)

print("event fd: ", button.event_get_fd())

while True:
    if button.event_wait(timedelta(seconds=600)):
        # event_read() is blocking function.
        event = button.event_read()
        if event.event_type == line_event.FALLING_EDGE:
            print("falling: ", event.timestamp)
            requests.get('http://localhost/toggle_irrigation?pin=19&times=60m')
