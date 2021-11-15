#!/usr/bin/env python3

import os
from flask import Flask, jsonify, request

sysfs='/sys/class/gpio/'

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

if __name__ == '__main__':
    app.run(host="0.0.0.0",debug=False)

