#!/usr/bin/env python3

import os
import subprocess
from flask import Flask, jsonify, request
# apt install python3-flask

sysfs='/sys/class/gpio/'
irrigation=None
irrigation_times=""

def gpioOut(pin, out = None):
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
    with open(val) as f:
        if out is None:
            return int(f.read())
        value = "%d\n" % out
        if (f.read() != value):
            print("pin %d is now %d" % (pin, out))
            with open(val, "w") as f2:
                f2.write(value)

def poll_irrigation():
    global irrigation_times, irrigation
    if irrigation is None:
        return ""
    if irrigation.poll() is None:
        return irrigation_times
    irrigation = None
    return ""

def start_irrigation(pin, times):
    global irrigation_times, irrigation
    poll = poll_irrigation()
    if poll != "":
        os.system("logger irrigation already started: " + poll)
    else:
        irrigation_times = times
        irrigation = subprocess.Popen(["/root/temp-switch/irrigation.sh", "%s" % pin] + times.split(','))
                
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
            pass
            
#print(gpioOut(121))
#gpioOut(121, 0)
#gpioOut(122, 0)
app = Flask(__name__)

@app.route('/gpio', methods=['GET'])
def get_gpio():
    return jsonify({'gpio':gpioOut(int(request.args.get('pin')))})
@app.route('/setgpio', methods=['GET'])
def get_setgpio():
    gpioOut(int(request.args.get('pin')), int(request.args.get('value')))
    return jsonify({'gpio_set':'ok'})
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
@app.route('/poll_irrigation', methods=['GET'])
def poll_irrigation_req():
    return jsonify({'times': poll_irrigation()})

if __name__ == '__main__':
    app.run(host="0.0.0.0",debug=False)
    #print(dht22("12"))

