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

#include "locking.h"

#define MAXTIMINGS 85
static int DHTPIN = 10;
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
        float t, h;
        h = (float)dht22_dat[0] * 256 + (float)dht22_dat[1];
        h /= 10;
        t = (float)(dht22_dat[2] & 0x7F)* 256 + (float)dht22_dat[3];
        t /= 10.0;
        if ((dht22_dat[2] & 0x80) != 0)  t *= -1;


    printf("Humidity = %.2f %% Temperature = %.2f *C \n", h, t );
		printf("Data ok %02x-%02x-%02x-%02x = %02x\n", dht22_dat[0], dht22_dat[1], dht22_dat[2], dht22_dat[3], dht22_dat[4]);
    return 1;
  }
  else
  {
    printf("Data not good, skip %02x-%02x-%02x-%02x = %02x\n", dht22_dat[0], dht22_dat[1], dht22_dat[2], dht22_dat[3], dht22_dat[4]);
    return 0;
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


int main (int argc, char *argv[])
{
	mofile = open("/sys/class/gpio/gpio10/direction", O_WRONLY);
	wrfile = open("/sys/class/gpio/gpio10/value", O_WRONLY);
	rdfile = open("/sys/class/gpio/gpio10/value", O_RDONLY);

testdelay();

  int lockfd;
  int tries = 100;

  if (argc < 2)
    printf ("usage: %s <pin> (<tries>)\ndescription: pin is the wiringPi pin number\nusing 7 (GPIO 4)\nOptional: tries is the number of times to try to obtain a read (default 100)",argv[0]);
  else
    DHTPIN = atoi(argv[1]);
   

  if (argc == 3)
    tries = atoi(argv[2]);

  if (tries < 1) {
    printf("Invalid tries supplied\n");
    exit(EXIT_FAILURE);
  }

  printf ("Raspberry Pi wiringPi DHT22 reader\nwww.lolware.net\nPIN: %d\n", DHTPIN) ;

  lockfd = open_lockfile(LOCKFILE);

  if (wiringPiSetupGpio () == -1)
    exit(EXIT_FAILURE) ;
	

  //pinMode(DHTPIN, OUTPUT);
  //printf("mode out exit\n");
  //return -1;

  if (setuid(getuid()) < 0)
  {
    perror("Dropping privileges failed\n");
    exit(EXIT_FAILURE);
  }

  while (read_dht22_dat() == 0 && tries--) 
  {
     delay(1000); // wait 1sec to refresh
  }

  delay(1500);
  close_lockfile(lockfd);

  return 0 ;
}
