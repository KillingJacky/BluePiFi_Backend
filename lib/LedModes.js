var Apa102spi = require('apa102-spi');

var num_leds = 3;

var ledDrv = new Apa102spi(num_leds, 100);
var stop = false;
const resolution = 10;
var steps;
var step_idx;
var step;
var r,g,b;
var mode = 0; //0: single color, 1: rgb

function draw(){
    var bright = step * step_idx;
    if(bright>31) bright = 63-bright;
    if(bright<0) bright = 0;
    if(bright>31) bright = 31;

    for (var led_index = 0; led_index < num_leds; led_index++) {
        ledDrv.setLedColor(led_index, bright, r, g, b);
    }
    ledDrv.sendLeds();
    if(++step_idx > steps){
        step_idx = 0;
        if(mode == 1){
            if(r == 255){
                r = 0; g = 255;
            }else if(g == 255){
                g = 0; b = 255;
            }else if(b == 255){
                b = 0; r = 255;
            }
        }
    }
    
}

function loop(){
    if(!stop){
        draw();
        setTimeout(loop, resolution);
    }else{
        r = g = b = 0;
        step_idx = 0;
        draw();
    }
}

function breath(duration_ms, r_, g_, b_){
    mode = 0;
    r = r_;
    g = g_;
    b = b_;

    steps = Math.ceil(duration_ms/resolution);
    step = 63.0 / steps;
    step_idx = 0;
    stop = false;

    loop();
}

function breath_rgb(duration_ms){
    mode = 1;
    r = 255;
    g = 0;
    b = 0;

    steps = Math.ceil(duration_ms/resolution);
    step = 63.0 / steps;
    step_idx = 0;
    stop = false;

    loop();
}

function stopLoop(){
    stop = true;
}

// breath(2000, 200, 0, 0);
// breath_rgb(2000);
module.exports.breath = breath;
module.exports.breath_rgb = breath_rgb;
module.exports.stop = stopLoop;
