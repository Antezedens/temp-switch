#!/usr/bin/env python3

import os
import subprocess
import threading
import glob

from flask import Flask, jsonify, request
from pytimeparse.timeparse import timeparse
from datetime import datetime, timedelta
# apt install python3-flask

def run_irrigation(pin, times, evt):
    print("running timeout on %d - times: %s" % (pin, times))
    first = True
    for i in times:
        if first:
            first = False
        else:
            if evt.wait(60):
                return
        print("%d -> on, wait %ds" % (pin, i))
        handleGpio(pin, 0)
        stop = evt.wait(i)
        handleGpio(pin, 1)
        print("%d -> off" % pin)
        if stop:
            return


def time_string_to_sec(time):
    return timeparse(time)

class Irrigation:
    def __init__(self, pin, times):
        self.evt = threading.Event()
        self.times = list(map(time_string_to_sec, times.split(',')))
        self.thread = threading.Thread(target=run_irrigation, args=(pin, self.times, self.evt))
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

def handleGpio(pin, out = None):
    global gpioserver_dir, sysfs
    forcedOut = False
    direction = sysfs + 'gpio%d/direction' % pin
    val = sysfs + 'gpio%d/value' % pin
    if not (os.path.isfile(direction)):
        with open(sysfs + "export",'w',encoding = 'utf-8') as f:
            f.write("%d" % pin)
            print("exported %d" % pin)
    with open(direction) as f:
        if (f.read() != 'out\n'):
            print("configure %d as out" % pin)
            with open(direction, "w") as f2:
                f2.write('out')
                forcedOut = True
                out = 1
    with open(val) as f:
        if out is None:
            return int(f.read())
        value = "%d\n" % out
        tempfile = gpioserver_dir + '%d.pin' % pin
        if not os.path.exists(tempfile):
            with open(tempfile, "w") as _:
                pass

        if (f.read() != value):
            print("pin %d is now %d" % (pin, out))
            with open(val, "w") as f2:
                f2.write(value)
                if forcedOut:
                    return out

def poll_irrigation(pin):
    global irrigation
    if pin not in irrigation:
        print("key not in dict")
        return ""
    if irrigation[pin].is_alive():
        print("alive")
        return irrigation[pin].finished
    print("thread dead")
    irrigation.pop(pin)
    return ""

def toggle_irrigation(pin, times):
    global irrigation
    poll = poll_irrigation(pin)
    if poll != "":
        irrigation[pin].stop()
        return "stopped"
    else:
        start_irrigation(pin, times)
        return "started"

def start_irrigation(pin, times):
    global irrigation
    poll = poll_irrigation(pin)
    if poll != "":
        os.system("logger irrigation already started: " + pin + " : " + poll)
    else:
        irrigation[pin] = Irrigation(pin, times)
                
def dht22(pin):
    for i in range(0,10):
        try:
            return subprocess.run(["/root/temp-switch/dht22/dht", "--json", pin], capture_output=True, check=True).stdout.decode()
        except:
            print("failed %d" % (i))
            pass
        
def htu21d(i2c):
    for i in range(0,10):
        try:
            return subprocess.run(["/root/temp-switch/htu21d/HTU21D", "--json"], capture_output=True, check=True).stdout.decode()
        except:
            print("failed %d" % (i))

def w1_temp(id):
    for i in range(0,10):
        try:
            with open("/sys/bus/w1/devices/%s/temperature" % id) as f:
                contents = f.readline().strip()
                if len(contents) > 0:
                    return { "temp": int(contents) / 1000.0}
        except:
            print("failed %d" % (i))


#print(handleGpio(121))
#handleGpio(121, 0)
#handleGpio(122, 0)
app = Flask(__name__)

@app.route('/gpio', methods=['GET'])
def get_gpio():
    return jsonify({'gpio':handleGpio(int(request.args.get('pin')))})
@app.route('/setgpio', methods=['GET'])
def get_setgpio():
    handleGpio(int(request.args.get('pin')), int(request.args.get('value')))
    return jsonify({'gpio_set':'ok'})
@app.route('/dht22', methods=['GET'])
def get_dht22():
    return dht22(request.args.get('pin'))
@app.route('/htu21d', methods=['GET'])
def get_htu21d():
    return htu21d(request.args.get('i2c'))
@app.route('/start_irrigation', methods=['GET'])
def start_irrigation_req():
    start_irrigation(int(request.args.get('pin')), request.args.get('times'))
    return jsonify({'ok':True})
@app.route('/toggle_irrigation', methods=['GET'])
def toggle_irrigation_req():
    return jsonify({'action':toggle_irrigation(int(request.args.get('pin')), request.args.get('times'))})
@app.route('/poll_irrigation', methods=['GET'])
def poll_irrigation_req():
    return jsonify({'times': poll_irrigation(int(request.args.get('pin')))})
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
                pinint = int(os.path.basename(pin).split('.')[0])
                handleGpio(pinint, 1) # initially turn off
            except:
                print("did not work to disable %s" % pin)

    app.run(host="0.0.0.0",debug=False)
    #print(dht22("12"))

