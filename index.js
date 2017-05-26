var os = require('os');
const EventEmitter = require('events');
var bleno = require('bleno');
var eddystone = require('eddystone-beacon');
var rpio = require('rpio');

var exec = require('child_process').exec;
var path = require('path');
var ip2int = require('ip-to-int');

var SSIDCharacteristic = require('./lib/SSIDCharacteristic');
var PasswordCharacteristic = require('./lib/PasswordCharacteristic');
var IpAddressCharacteristic = require('./lib/IPAddressCharacteristic');
var ledMode = require('./lib/LedModes');

const myEE = new EventEmitter();

var ssidChar = new SSIDCharacteristic(newSSID);
var passwordChar = new PasswordCharacteristic(newPassword);
var ipAddressChar = new IpAddressCharacteristic();

var ssid;
var password;
var ipaddress;
var interval;
var poweredOn = false;
var shouldAdv = false;

function newSSID(newSSID) {
  console.log(newSSID.toString('utf8'));
  ssid = newSSID.toString('utf8');
}

function newPassword(newPass) {
  console.log(newPass.toString('utf8'));
  password = newPass.toString('utf8');

  var script = path.join(__dirname, 'setNetwork.sh');
  script += ' ';
  script += [ssid, password].join(' ');

  exec(script,[], function(err, stdout, stderr) {
    if (err) {
      console.log(err);
      if (stderr) {
        console.log(stderr);
      }
      ipAddressChar.checkIPAddress(false);
      ipAddressChar.update();
      return;
    }

    if (stdout) {
      console.log('stdout:'+stdout);
      if(stdout.indexOf('Failed') >= 0)
      {
        ipAddressChar.checkIPAddress(false);
        ipAddressChar.update();
        return;
      }
    }
  });

  ipAddressChar.startCheckIPAddress();
}



var service = new bleno.PrimaryService({
	uuid: '76A46D65-4293-420C-B468-79FFB84FC000',
	characteristics: [
		ssidChar,
		passwordChar,
		ipAddressChar
	]
});

bleno.on('advertisingStart', function(err) {
  if (err) {
    throw err;
  }

  console.log('on -> advertisingStart');

  bleno.setServices([
    service
  ]);
});

function startAdv()
{
  var bdaddress = bleno.address;

  if (!bdaddress) return;
  console.log('my address: '+bdaddress);

  var name = 'RPi-' + bdaddress.slice(9).toUpperCase().replace(/:/g,'');
  console.log('name: '+name);

  // var serviceUuids = ['fff0']

  // bleno.startAdvertising(name, serviceUuids);
  
  //var hostname = os.hostname();

  var options = {
    name: name
  };

  eddystone.advertiseUrl('http://respeaker.io',options);

  ledMode.breath_rgb(3000);
}

bleno.on('stateChange', function(state){
  console.log('state -> ' + state);
  if (state === 'poweredOn'){
    poweredOn = true;
    if(shouldAdv)
    {
      console.log('* start advertising...');
      startAdv();
    }
  }
  
});

bleno.on('accept', clientAddr => {
  console.log('accepted -> '+clientAddr);
});

bleno.on('disconnect', clientAddr => {
  console.log('disconnected -> '+clientAddr);
  if(shouldAdv)
  {
    startAdv();
  }  
});

///-------
/// Button monitoring
var PIHAT_BTN = 11;  //rpio uses the pin num on the 2row header
var button_down_time = -1;
var button_trigger_time = 3; //sec

rpio.open(PIHAT_BTN, rpio.INPUT, rpio.PULL_UP);  //0: pressed 1: idle

function micro(){
  var hrTime = process.hrtime();
  return hrTime[0] * 1000000 + hrTime[1] / 1000;
}

myEE.on('surely_powered_on', ()=>{
  shouldAdv = true;
  if(!poweredOn){
    console.log('First time power on hci0, will start advertising when hci0 is up.');
    return;
  }
  console.log('start advertising...');
  startAdv();
});

function do_when_button_long_pressed(){
  //make sure the bluetooth hardware is powered on
  exec('hciconfig hci0 up',[], function(err, stdout, stderr) {
    if (err) {
      console.log('error when hciconfig hci0 up:' + err);
      if (stderr) {
        console.log(stderr);
      }
      return;
    }

    if (stdout) {
      console.log('stdout:'+stdout);
      // if(stdout.indexOf('Failed') >= 0)
      // {
      //   ipAddressChar.checkIPAddress(false);
      //   ipAddressChar.update();
      //   return;
      // }
    }
    myEE.emit('surely_powered_on');
  });
}

function do_when_button_pressed(){
  if(shouldAdv){
    console.log('stop advertising...');
    bleno.stopAdvertising(()=>{
      console.log('advertising stopped!');
      shouldAdv = false;

      ledMode.stop();

      // exec('hciconfig hci0 down',[], function(err, stdout, stderr) {
      //   if (err) {
      //     console.log('error when hciconfig hci0 down:' + err);
      //     if (stderr) {
      //       console.log(stderr);
      //     }
      //     return;
      //   }

      //   if (stdout) {
      //     console.log('stdout:'+stdout);
      //   }
      //   console.log('the bluetooth has been shut down.');
      // });
    });
  }
}

var interval_check = null;

function pollcb(pin)
{
  /*
    * Interrupts aren't supported by the underlying hardware, so events
    * may be missed during the 1ms poll window.  The best we can do is to
    * print the current state after a event is detected.
    */
  var state = rpio.read(pin) ? 'released' : 'pressed';

  if(pin == PIHAT_BTN && state === 'pressed')
  {
    button_down_time = micro();
    if(interval_check){
      clearInterval(interval_check);
    }
    interval_check = setInterval(()=>{
      var state_ = rpio.read(pin) ? 'released' : 'pressed';
      if(state_ === 'pressed'){
        var current = micro();
        if(current - button_down_time > button_trigger_time * 1000000)
        {
          console.log('HAT button is long pressed');
          do_when_button_long_pressed();
          clearInterval(interval_check);
          interval_check = null;
          button_down_time = -1;
        }
      }else{
        clearInterval(interval_check);
        interval_check = null;
        button_down_time = -1;
      }
    }, 100);
  }else if(pin == PIHAT_BTN && state === 'released' && button_down_time > 0)
  {
    var current = micro();
    if(current - button_down_time < button_trigger_time * 1000000)
    {
      console.log('HAT button is pressed');
      do_when_button_pressed();
    }
    button_down_time = -1;
  }
}

rpio.poll(PIHAT_BTN, pollcb);

  

