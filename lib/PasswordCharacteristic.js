var bleno = require('bleno');
var util = require('util');

function PasswordCharacteristic(callback) {
  bleno.Characteristic.call(this, {
    uuid: '76A46D65-4293-420C-B468-79FFB84FC002',
    properties: ['write'],
    descriptors: [
      new bleno.Descriptor({
        uuid: '2901',
        value: 'Password'
      })
    ]
  });
  this._callback = callback;
}

util.inherits(PasswordCharacteristic, bleno.Characteristic);

PasswordCharacteristic.prototype.onWriteRequest = function(data, offset, withoutResponse, callback) {
  this._callback(data);
  callback(this.RESULT_SUCCESS);
}

module.exports = PasswordCharacteristic;