import sys
from datetime import timedelta, datetime
from gpiod import chip, line_request, line_event
import requests
import time


CHIP = 0
LINE_OFFSET = 6
#LED_LINE_OFFSET = 198
EDGE = line_request.EVENT_FALLING_EDGE

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

requests.get('http://localhost:5000/toggle_irrigation?pin=198&times=60m')

lastevent = datetime.utcfromtimestamp(0)
while True:
    if button.event_wait(timedelta(seconds=600)):
        # event_read() is blocking function.
        event = button.event_read()
        if event.event_type == line_event.FALLING_EDGE:
            if abs((event.timestamp - lastevent).total_seconds()) > 0.02:
                print("falling: ", event.timestamp)
                lastevent = event.timestamp
                requests.get('http://localhost:5000/toggle_irrigation?pin=198&times=60m')
            else:
                print("ignore bounce event")