var os = require('os');
var bleno = require('bleno');
var util = require('util');
var ip2int = require('ip-to-int');

var blank_ip = '0.0.0.0';

function IPAddressCharacteristic() {
  bleno.Characteristic.call(this, {
    uuid: '76A46D65-4293-420C-B468-79FFB84FC003',
    properties: ['read','notify'],
    descriptors: [
      new bleno.Descriptor({
        uuid: '2901',
        value: 'IP Address'
      })
    ]
  });
  this._ip_wlan = ip2int(blank_ip).toInt();
  this._ip_eth = ip2int(blank_ip).toInt();
  this._interval = null;
}

util.inherits(IPAddressCharacteristic, bleno.Characteristic);

IPAddressCharacteristic.prototype.onReadRequest = function(offset, callback) {
  this.checkIPAddress(false);

  var buffer = new Buffer(8);
  buffer.writeUInt32BE(this._ip_wlan);
  buffer.writeUInt32BE(this._ip_eth, 4);

  callback(this.RESULT_SUCCESS, buffer);
}

IPAddressCharacteristic.prototype.onSubscribe = function(maxValueSize, updateValueCallback) {
  this._updateValueCallback = updateValueCallback;
  console.log("start notify ipAddress");
}

IPAddressCharacteristic.prototype.onUnsubscribe = function () {
  this._updateValueCallback = null;
  console.log("stop notify ipAddress");
}

IPAddressCharacteristic.prototype.update = function() {
  var buffer = new Buffer(8);
  buffer.writeUInt32BE(this._ip_wlan);
  buffer.writeUInt32BE(this._ip_eth, 4);

  if (this._updateValueCallback) {
    this._updateValueCallback(buffer);
  }
}

IPAddressCharacteristic.prototype.set = function(ip_wlan, ip_eth) {
  this._ip_wlan = ip_wlan;
  this._ip_eth = ip_eth;
}

IPAddressCharacteristic.prototype.startCheckIPAddress = function(){
  //check for ipAddress every 5 seconds
  if(this._interval) {
    clearInterval(this._interval);
  }
  this._interval = setInterval(()=>{this.checkIPAddress(true);},1000);
}

IPAddressCharacteristic.prototype.checkIPAddress = function(monitor_wlan) {
  var interfaces = os.networkInterfaces();
  var addr_wlan = blank_ip;
  var addr_eth = blank_ip;

  if (interfaces['wlan0']) {
    var wlan0 = interfaces['wlan0'];
    for (var i=0; i< wlan0.length; i++) {
      if (wlan0[i].family === 'IPv4') {
        addr_wlan = wlan0[i].address;
      }
    }
  }

  //check LAN IP
  if (interfaces['eth0']) {
    var eth0 = interfaces['eth0'];
    for (var i=0; i< eth0.length; i++) {
      if (eth0[i].family === 'IPv4') {
        addr_eth = eth0[i].address;
      }
    }
  }

  if(monitor_wlan){
    if (addr_wlan !== blank_ip){
      console.log(addr_wlan+","+addr_eth);
      this.set(ip2int(addr_wlan).toInt(), ip2int(addr_eth).toInt());
      this.update();
      
      if(this._interval){
        clearInterval(this._interval);
        this._interval = null;
      }
    }
  }else{
    console.log(addr_wlan+","+addr_eth);
    this.set(ip2int(addr_wlan).toInt(), ip2int(addr_eth).toInt());

    if(this._interval){
      clearInterval(this._interval);
      this._interval = null;
    }
  }
} 


module.exports = IPAddressCharacteristic;