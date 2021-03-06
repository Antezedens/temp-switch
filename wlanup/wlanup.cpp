#include <stdio.h>
#include <stdlib.h>
#include <arpa/inet.h>
#include <string.h>
#include <sys/ioctl.h>
#include <net/if.h>
#include <fcntl.h>
#include <unistd.h>

char IFACE[16] = "wlan1";
char buffer[128];
void writeState(int state) {
  int stateFd = open("/tmp/wlan_state", O_WRONLY | O_CREAT, 0666);
  if (not stateFd) {
    perror("open state file");
    return;
  }
  write(stateFd, state ? "1\n" : "0\n", 2);
  close(stateFd);
}

int readState() {
  int stateFd = open("/tmp/wlan_state", O_RDONLY);
  if (not stateFd) {
    perror("open state file for reading");
    return 0;
  }
  char state = 0;
  read(stateFd, &state, 1);
  close(stateFd);
  return state == '1';
}

int checkaddressOk(int sock) {
  struct ifreq ethreq;
  strncpy(ethreq.ifr_name, IFACE, IFNAMSIZ);
  ioctl(sock, SIOCGIFINDEX, &ethreq);
  if (ioctl(sock, SIOCGIFADDR, &ethreq) != 0) {
    perror("no address!\n");
    writeState(0);
    return 0;
  }
  else {
    sockaddr_in* my_sin = (sockaddr_in*) &ethreq.ifr_addr;
    char str[128];
    inet_ntop(AF_INET, &my_sin->sin_addr, str, sizeof(str));
    printf("addr: %s - ok\n", str);
    if (not readState()) {
      //printf("restart python\n");
      //system("/usr/bin/killall python2.7");
      writeState(1);
    }
    return 1;
  }

}

int bringupIfDown() {
  sprintf(buffer, "/sbin/iwgetid %s | /bin/grep tigernetz", IFACE);
  if (system(buffer)) {
    printf("bring interface up...\n");
	sprintf(buffer, "/sbin/ifup %s", IFACE);
    system(buffer);
    return 1;
  }
  return 0;
}

int main(int argc, char* argv[]) {
  const int sock = socket(AF_INET, SOCK_DGRAM, 0);
  if (argc > 1) {
	  strcpy(IFACE, argv[1]);
  }
  
  if (not sock) {
    perror("could not open socket\n");
    return -1;
  }
  if (checkaddressOk(sock)) {
    return 0;
  }
  if (bringupIfDown()) {
    if (not checkaddressOk(sock)) {
      sleep(5 * 60);
      bringupIfDown();
      checkaddressOk(sock);
    }
  }
  return 0;
}
