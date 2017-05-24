# WiFi-Provision

This is a NodeJS app to configure WiFi on a Raspberry Pi 3 or a 
Pi Zero with IoT pHAT via Bluetooth Low Energy and Web Bluetooth.

The reasons for this can be found [here](http://www.hardill.me.uk/wordpress/2016/09/13/provisioning-wifi-iot-devices/)

## How

To run clone the code

    git clone https://github.com/KillingJacky/BluePiFi_Backend.git

Install bleno, follow guide here https://github.com/sandeepmistry/bleno

And especially make sure that you have stopped the bluetoothd service

    sudo systemctl stop bluetooth
    sudo systemctl disable bluetooth

You can now run this as root

    sudo node index.js

Now open the `BluePiFi` app... 
