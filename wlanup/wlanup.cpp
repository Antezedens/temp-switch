#include <stdio.h>
#include <stdlib.h>
#include <arpa/inet.h>
#include <string.h>
#include <sys/ioctl.h>
#include <net/if.h>
#include <fcntl.h>
#include <unistd.h>

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
  strncpy(ethreq.ifr_name, "wlan0", IFNAMSIZ);
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
      printf("restart python\n");
      system("killall python2.7");
      writeState(1);
    }
    return 1;
  }

}

int main() {
  int sock = socket(AF_INET, SOCK_DGRAM, 0);
  if (not sock) {
    perror("could not open socket\n");
    return -1;
  }

  if (not checkaddressOk(sock)) {
    if (system("/sbin/iwgetid wlan0 | /bin/grep tigernetz")) {
      printf("bring interface up...\n");
      system("/sbin/ifup wlan0");
      checkaddressOk(sock);
    }
  }
  return 0;
}
