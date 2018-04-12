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


void pinMode(int pin, int inout) {
	int file = open("/sys/class/gpio/gpio10/direction", O_WRONLY);
	if (inout == OUTPUT) {
		write(file, "out\n", 4);
	} else {
		write(file, "in\n", 3);
	}
	close(file);
}

void digitalWrite(int pin, int value) {
	int file = open("/sys/class/gpio/gpio10/value", O_WRONLY);
	if (value == HIGH) {
		write(file, "1\n", 2);
	} else {
		write(file, "0\n", 2);
	}
	close(file);
}
int digitalRead(int pin) {
	int result;
	int file = open("/sys/class/gpio/gpio10/value", O_RDONLY);
	char v = 'x';
	read(file, &v, 1);
	close(file);
	result = v == '1';
	//printf("%c>%d\n", v, result);
	return result;
}


static uint8_t sizecvt(const int read)
{
  /* digitalRead() and friends from wiringpi are defined as returning a value
  < 256. However, they are returned as int() types. This is a safety function */

  if (read > 255 || read < 0)
  {
    printf("Invalid data from wiringPi library\n");
    exit(EXIT_FAILURE);
  }
  return (uint8_t)read;
}

static int read_dht22_dat()
{
  uint8_t laststate = HIGH;
  uint8_t counter = 0;
  uint8_t j = 0, i;

  dht22_dat[0] = dht22_dat[1] = dht22_dat[2] = dht22_dat[3] = dht22_dat[4] = 0;

  // pull pin down for 18 milliseconds
  pinMode(DHTPIN, OUTPUT);
  digitalWrite(DHTPIN, HIGH);
  delay(10);
  digitalWrite(DHTPIN, LOW);
  delay(18);
  // then pull it up for 40 microseconds
  digitalWrite(DHTPIN, HIGH);
  delayMicroseconds(40); 
  // prepare to read the pin
  pinMode(DHTPIN, INPUT);

  // detect change and read data
  for ( i=0; i< MAXTIMINGS; i++) {
    counter = 0;
    while (sizecvt(digitalRead(DHTPIN)) == laststate) {
      counter++;
      delayMicroseconds(2);
      if (counter == 255) {
        break;
      }
    }
    laststate = sizecvt(digitalRead(DHTPIN));

    if (counter == 255) break;

    // ignore first 3 transitions
    if ((i >= 4) && (i%2 == 0)) {
      // shove each bit into the storage bytes
      dht22_dat[j/8] <<= 1;
      if (counter > 16)
        dht22_dat[j/8] |= 1;
      j++;
    }
  }

  // check we read 40 bits (8bit x 5 ) + verify checksum in the last byte
  // print it out if data is good
  if ((j >= 40) && 
      (dht22_dat[4] == ((dht22_dat[0] + dht22_dat[1] + dht22_dat[2] + dht22_dat[3]) & 0xFF)) ) {
        float t, h;
        h = (float)dht22_dat[0] * 256 + (float)dht22_dat[1];
        h /= 10;
        t = (float)(dht22_dat[2] & 0x7F)* 256 + (float)dht22_dat[3];
        t /= 10.0;
        if ((dht22_dat[2] & 0x80) != 0)  t *= -1;


    printf("Humidity = %.2f %% Temperature = %.2f *C \n", h, t );
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
