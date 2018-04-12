/*
 *      dht22.c:
 *	Simple test program to test the wiringPi functions
 *	Based on the existing dht11.c
 *	Amended by technion@lolware.net
 */

#include <wiringPi.h>

#include <stdio.h>
#include <stdlib.h>
#include <stdint.h>
#include <sys/types.h>
#include <unistd.h>
#include <fcntl.h>
#include <time.h>
#include <signal.h>
#include <sys/time.h>
#include <sys/resource.h>
#include <sys/syscall.h>

#include "locking.h"

#define MAXTIMINGS 85
static int DHTPIN = 12;
static int dht22_dat[5] = {0,0,0,0,0};

void delayMicroseconds(int us) {
	struct timespec ts;
	clock_gettime(CLOCK_REALTIME, &ts);
	ts.tv_nsec += us * 1000;
	if (ts.tv_nsec > 1000 * 1000 * 1000) {
		ts.tv_sec ++;
		ts.tv_nsec -= 1000 * 1000 * 1000;
	}
	struct timespec ts2;
	do {
		clock_gettime(CLOCK_REALTIME, &ts2);
		if (ts2.tv_sec == ts.tv_sec && ts2.tv_nsec > ts.tv_nsec) {
			break;
		}
		if (ts2.tv_sec > ts.tv_sec) {
			break;
		}
	} while (1);
	//printf("%d.%09d -> %d.%09d\n", ts.tv_sec, ts.tv_nsec, ts2.tv_sec, ts2.tv_nsec);
}
void delay(int ms) {
	delayMicroseconds(ms * 1000);
}

int mofile;
int wrfile;
int rdfile;

void pinMode(int pin, int inout) {
	lseek(mofile, 0, SEEK_SET);
	if (inout == OUTPUT) {
		write(mofile, "out\n", 4);
	} else {
		write(mofile, "in\n", 3);
	}
}

void digitalWrite(int pin, int value) {
	lseek(wrfile, 0, SEEK_SET);
	if (value == HIGH) {
		write(wrfile, "1\n", 2);
	} else {
		write(wrfile, "0\n", 2);
	}
}

int digitalRead(int pin) {
	int result;
	char v = 'x';
	lseek(rdfile, 0, SEEK_SET);
	read(rdfile, &v, 1);
	result = v == '1';
	//printf("%c>%d\n", v, result);
	return result;
}


static void waitfor(int v) {
	while (digitalRead(DHTPIN) != v);
}

static int read_dht22_dat()
{
  uint8_t i;

  dht22_dat[0] = dht22_dat[1] = dht22_dat[2] = dht22_dat[3] = dht22_dat[4] = 0;

  // pull pin down for 18 milliseconds
  pinMode(DHTPIN, OUTPUT);
  digitalWrite(DHTPIN, HIGH);
  delay(10);
  digitalWrite(DHTPIN, LOW);
  delay(18);
  // then pull it up for 40 microseconds
  digitalWrite(DHTPIN, HIGH);
  //delayMicroseconds(1); 
  // prepare to read the pin
  pinMode(DHTPIN, INPUT);

  waitfor(0);
	waitfor(1);
	waitfor(0);

  // detect change and read data
  for ( i=0; i< 40; i++) {
		struct timespec start, stop;
		waitfor(1);
		clock_gettime(CLOCK_REALTIME, &start);
		waitfor(0);
		clock_gettime(CLOCK_REALTIME, &stop);
				
		long diff = stop.tv_nsec - start.tv_nsec;
		if (diff < 0) {
			diff += 1000 * 1000 * 1000;
		}
		
		dht22_dat[i/8] <<= 1;
		if (diff > 49*1000) {
			dht22_dat[i/8] |= 1;
		}
  }

  // check we read 40 bits (8bit x 5 ) + verify checksum in the last byte
  // print it out if data is good
  if ((i >= 40) && 
      (dht22_dat[4] == ((dht22_dat[0] + dht22_dat[1] + dht22_dat[2] + dht22_dat[3]) & 0xFF)) ) {
        int t;
				int h;
        h = dht22_dat[0] * 256 + dht22_dat[1];
        t = dht22_dat[2] * 256 + dht22_dat[3];
        if (t & 0x8000) {
					t |= 0xffff0000;
				}


    printf("H=%d.%d T=%d.%d \n", h/10, h%10, t/10, t%10 );
    return 0;
  }
  else
  {
    printf("Data not good, skip %02x-%02x-%02x-%02x = %02x\n", dht22_dat[0], dht22_dat[1], dht22_dat[2], dht22_dat[3], dht22_dat[4]);
    return 1;
  }
}

void testdelay(void) {
	struct timespec ts;
	struct timespec ts2;
	clock_gettime(CLOCK_REALTIME, &ts);
	delayMicroseconds(15);
	//delay(10);
	clock_gettime(CLOCK_REALTIME, &ts2);
	printf("%ld -> %ld = %ld\n", ts.tv_nsec, ts2.tv_nsec, ts2.tv_nsec - ts.tv_nsec);
}

void stop(int ignore) {
	printf("timeout\n");
	exit(1);
}


int main (int argc, char *argv[])
{
	setpriority(PRIO_PROCESS, syscall(SYS_gettid), -19);
  signal(SIGALRM, stop);
	alarm(1);

  int lockfd;

  if (argc < 2)
    printf ("usage: %s <pin>\n",argv[0]);
  else
    DHTPIN = atoi(argv[1]);

  char buf[64];
	sprintf(buf, "/sys/class/gpio/gpio%d/direction", DHTPIN);
	mofile = open(buf, O_WRONLY);
	sprintf(buf, "/sys/class/gpio/gpio%d/value", DHTPIN);
	wrfile = open(buf, O_WRONLY);
 	rdfile = open(buf, O_RDONLY);

  lockfd = open_lockfile(LOCKFILE);

  if (wiringPiSetupGpio () == -1)
    exit(EXIT_FAILURE) ;
	
  if (setuid(getuid()) < 0)
  {
    perror("Dropping privileges failed\n");
    exit(EXIT_FAILURE);
  }

  int res = read_dht22_dat();

  close_lockfile(lockfd);

  return res ;
}
