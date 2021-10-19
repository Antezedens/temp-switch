#!/usr/bin/python3
import subprocess
import time

for i in range(100):
    start = time.time()
    if subprocess.run(["ping", "-c1", "10.5.5.1"]).returncode == 0:
    #if subprocess.run(["ping", "-c1", "40.40.40.40"]).returncode == 0:
    #if subprocess.run(["ping", "-c1", "1www.google.at"]).returncode == 0:
        subprocess.run(["logger", "wlan check ok"])
        exit(0)
    elapsed = time.time() - start
    if elapsed < 10:
        time.sleep(10 - elapsed)

    
subprocess.run(["logger", "wlan down rebooting"])
subprocess.run(["reboot"])
