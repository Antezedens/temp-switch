#!/usr/bin/python3
import subprocess
import time

for i in range(10):
    start = time.time()
    if subprocess.run(["ping", "-c1", "www.google.at"]).returncode == 0:
    #if subprocess.run(["ping", "-c1", "40.40.40.40"]).returncode == 0:
    #if subprocess.run(["ping", "-c1", "1www.google.at"]).returncode == 0:
        subprocess.run(["logger", "internet check ok"])
        exit(0)
    elapsed = time.time() - start
    if elapsed < 10:
        time.sleep(10 - elapsed)

# 198 - 4
# 199 - 3
#   7 - 2
#  19 - 1

PIN=19

def writefile(f, text):
    try:
        with open(f, 'w') as f:
            f.write(text)
    except Exception as e:
        print(e)

writefile('/sys/class/gpio/export', str(PIN))
writefile('/sys/class/gpio/gpio%s/direction' % PIN, "out")
writefile('/sys/class/gpio/gpio%s/value' % PIN, '0')
time.sleep(1)
writefile('/sys/class/gpio/gpio%s/value' % PIN, '1')
    
