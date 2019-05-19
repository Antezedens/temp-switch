#include <stdio.h>
#include <errno.h>
#include <stdlib.h>
#include <string.h>
#include <fcntl.h>
#include <sys/ioctl.h>

#define I2C_SLAVE	0x0703	/* Change slave address			*/
#include "HTU21D.h"

int main ()
{
	int fd = open("/dev/i2c-0", O_RDWR);
	if ( 0 > fd )
	{
		fprintf (stderr, "Unable to open I2C device: %s\n", strerror (errno));
		exit (-1);
	}
	ioctl(fd, I2C_SLAVE, 0x40);
	
	printf("H=%5.2f T=%5.2f\n", getHumidity(fd), getTemperature(fd));
	
	return 0;
}
