# BluePiFi Backend

This is a NodeJS app to configure WiFi on a Raspberry Pi 3 or a 
Pi Zero with SeeedStudio 2Mic Hat via Bluetooth Low Energy and a mobile app named `BluePiFi`.

## How

First you need install the full node.js on RPi, the pre-installed node doesn't ship with npm.

Go to user `pi`'s home 

    cd ~

Note: you need to clone the code into home because the systemd service file hard-coded the path.

    sudo apt-get install bluetooth bluez libbluetooth-dev libudev-dev
    sudo systemctl stop bluetooth
    sudo systemctl disable bluetooth
    git clone https://github.com/KillingJacky/node-bluepifi.git
    cd node-bluepifi
    npm install

This will install all the dependences of this program (into project directory).

Now you can test

    sudo node index.js

Press the button on Mic Hat for at least 3 seconds, the RPi will go into configure mode. Now open the `BluePiFi` app... 

After you've finished configuration, short press the button to stop BLE advertising and exit configure mode.

## Startup at boot

```
sudo cp bluepifi_backend.service /lib/systemd/system
sudo systemctl daemon-reload
sudo systemctl enable bluepifi_backend
sudo systemctl start bluepifi_backend
```

