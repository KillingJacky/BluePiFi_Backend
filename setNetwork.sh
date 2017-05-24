#!/bin/sh

SSID="$1"
PASS="$2"

if [ -z $SSID ]; then
  echo "SSID not set"
  exit 1
fi

ifdown wlan0

cat << EOF > /etc/wpa_supplicant/wpa_supplicant.conf
country=GB
ctrl_interface=DIR=/var/run/wpa_supplicant GROUP=netdev
update_config=1

network={
  ssid="$SSID"
  psk="$PASS"
  proto=RSN
  key_mgmt=WPA-PSK
  pairwise=CCMP TKIP
  group=CCMP TKIP
}
EOF

ifup wlan0