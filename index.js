var os = require('os');
var bleno = require('bleno');
var eddystone = require('eddystone-beacon');

var exec = require('child_process').exec;
var path = require('path');
var ip2int = require('ip-to-int');

var SSIDCharacteristic = require('./lib/SSIDCharacteristic');
var PasswordCharacteristic = require('./lib/PasswordCharacteristic');
var IpAddressCharacteristic = require('./lib/IPAddressCharacteristic');

var ssidChar = new SSIDCharacteristic(newSSID);
var passwordChar = new PasswordCharacteristic(newPassword);
var ipAddressChar = new IpAddressCharacteristic();

var ssid;
var password;
var ipaddress;
var interval;

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
}

bleno.on('stateChange', function(state){
  console.log('state -> ' + state);
  if (state == 'poweredOn'){
    startAdv();
  }
  
});

bleno.on('accept', clientAddr => {
  console.log('accepted -> '+clientAddr);
});

bleno.on('disconnect', clientAddr => {
  console.log('disconnected -> '+clientAddr);
  startAdv();
});



  

