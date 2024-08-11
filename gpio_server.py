#!/usr/bin/env python3

import os
import subprocess
import threading
import glob

from flask import Flask, jsonify, request
from pytimeparse.timeparse import timeparse
from datetime import datetime, timedelta
from gpiod import chip, line_request
# apt install python3-flask

def run_irrigation(pins, times, evt):
    print("running timeout on %s - times: %s" % (pins, times))
    first = True
    for i in times:
        if first:
            first = False
        else:
            if evt.wait(60):
                return
        print("%s -> on, wait %ds" % (pins, i))
        for pin in pins:
            handleGpioOut(pin, 0)
        stop = evt.wait(i)
        for pin in pins:
            handleGpioOut(pin, 1)
        print("%s -> off" % pins)
        if stop:
            return


def time_string_to_sec(time):
    return timeparse(time)

class Irrigation:
    def __init__(self, pins, times):
        self.evt = threading.Event()
        self.times = list(map(time_string_to_sec, times.split(',')))
        self.thread = threading.Thread(target=run_irrigation, args=(pins, self.times, self.evt))
        self.thread.start()
        finished = datetime.now()
        first = True
        for i in self.times:
            print(i)
            if first:
                first = False
            else:
                finished += timedelta(seconds=60)
            finished += timedelta(seconds=i)
        self.finished = finished.strftime("%d.%m. %H:%M:%S")

    def is_alive(self):
        return self.thread.is_alive()

    def stop(self):
        self.evt.set()
        self.thread.join()

irrigation = {}
gpios = {}

def handleGpioOut(key, out = None):
    global gpioserver_dir, gpios
    chip_line = key.split('-')
    if len(chip_line) == 1:
        gpio_chip = 0
        gpio_line = int(chip_line[0])
    else:
        gpio_chip = int(chip_line[0])
        gpio_line = int(chip_line[1])

    if key not in gpios:
        c = chip(gpio_chip)
        gpios[key] = c.get_line(gpio_line)
        config = line_request()
        config.consumer = "gpioserver"
        config.request_type = line_request.DIRECTION_OUTPUT
        gpios[key].request(config)
        print("requested %s" % key)

    tempfile = gpioserver_dir + ('%s.pin' % key)
    if not os.path.exists(tempfile):
        with open(tempfile, "w") as _:
            pass
    gpios[key].set_value(out)
    print("pin %s is now %d" % (key, out))

def handleGpioIn(key):
    global gpioserver_dir, gpios
    chip_line = key.split('-')
    gpio_chip = int(chip_line[0])
    gpio_line = int(chip_line[1])

    if key not in gpios:
        c = chip(gpio_chip)
        gpios[key] = c.get_line(gpio_line)
        config = line_request()
        config.consumer = "gpioserver"
        config.request_type = line_request.DIRECTION_OUTPUT
        gpios[key].request(config)
        print("requested %s" % key)

    return gpios[key].get_value()

def poll_irrigation(pin):
    global irrigation
    if pin not in irrigation:
        #print("key not in dict")
        return ""
    if irrigation[pin].is_alive():
        #print("alive")
        return irrigation[pin].finished
    #print("thread dead")
    irrigation.pop(pin)
    return ""

def toggle_irrigation(pins, times):
    global irrigation
    pin = pins.split(',')[0]
    poll = poll_irrigation(pin)
    if poll != "":
        irrigation[pin].stop()
        return "stopped"
    else:
        start_irrigation(pins, times)
        return "started"

def start_irrigation(pins, times):
    global irrigation
    pinlist = pins.split(',')
    pin = pinlist[0]
    poll = poll_irrigation(pin)
    if poll != "":
        os.system("logger irrigation already started: " + pin + " : " + poll)
    else:
        irrigation[pin] = Irrigation(pinlist, times)
                
def dht22(pin):
    for i in range(0,10):
        try:
            return subprocess.run(["/root/temp-switch/dht22/dht", "--json", pin], capture_output=True, check=True).stdout.decode()
        except:
            pass
    print("dht22 failed too often")

def htu21d(i2c):
    for i in range(0,10):
        try:
            return subprocess.run(["/root/temp-switch/htu21d/HTU21D", "--json"], capture_output=True, check=True).stdout.decode()
        except:
            pass
    print("htu21d failed too often")

def w1_temp(id):
    for i in range(0,10):
        try:
            with open("/sys/bus/w1/devices/%s/temperature" % id) as f:
                contents = f.readline().strip()
                if len(contents) > 0:
                    return { "temp": int(contents) / 1000.0}
        except:
            pass
    print("w1_temp failed too often")


#print(handleGpio(121))
#handleGpio(121, 0)
#handleGpio(122, 0)
app = Flask(__name__)


@app.route('/gpio', methods=['GET'])
def get_gpio():
    return jsonify(
        {
            'gpio': handleGpioIn(request.args.get('pin'))
        }
    )


@app.route('/setgpio', methods=['GET'])
def get_setgpio():
    handleGpioOut(request.args.get('pin'), int(request.args.get('value')))
    return jsonify({'gpio_set': 'ok'})


@app.route('/dht22', methods=['GET'])
def get_dht22():
    return dht22(request.args.get('pin'))
@app.route('/htu21d', methods=['GET'])
def get_htu21d():
    return htu21d(request.args.get('i2c'))
@app.route('/start_irrigation', methods=['GET'])
def start_irrigation_req():
    start_irrigation(request.args.get('pin'), request.args.get('times'))
    return jsonify({'ok':True})
@app.route('/toggle_irrigation', methods=['GET'])
def toggle_irrigation_req():
    return jsonify({'action':toggle_irrigation(request.args.get('pin'), request.args.get('times'))})
@app.route('/poll_irrigation', methods=['GET'])
def poll_irrigation_req():
    return jsonify({'times': poll_irrigation(request.args.get('pin'))})
@app.route('/w1_temp', methods=['GET'])
def w1_temp_req():
    return jsonify(w1_temp(request.args.get('id')))

if __name__ == '__main__':
    sysfs ='/sys/class/gpio/'
    gpioserver_dir='/tmp/gpioserver/'
    try:
        os.mkdir(gpioserver_dir)
    except: # already exists
        for pin in glob.glob(gpioserver_dir + '*.pin'):
            try:
                chip_pin = os.path.basename(pin).split('.')
                handleGpioOut(chip_pin[0], 1) # initially turn off
            except:
                print("could not disable %s" % pin)

    app.run(host="0.0.0.0",debug=False)
    #print(dht22("12"))

