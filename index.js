/* eslint-disable */
var token = require('./config').token;
var NEST_API_HOST = 'developer-api.nest.com';

var oled, omegaOledText;
try {
    oled = require('/usr/bin/node-oled-exp');
    oled.init();
    oled.setTextColumns();
    oled.clear();
    oled.write('START');
    omegaOledText = require('onion-omega-oled-text');
    omegaOledText.addCharacter('%', ['0x00', '0x00', '0x00', '0x1c', '0x14', '0x1c', '0x80', '0xc0', '0x60', '0x30', '0x18', '0x18', '0x0c', '0x06', '0x02', '0x00', '0x00', '0x10', '0x18', '0x0c', '0x06', '0x03', '0x01', '0x00', '0x00', '0x00', '0x07', '0x05', '0x07', '0x00', '0x00', '0x00']);

} catch (ex) {

}
/*

var Gpio = require('/usr/bin/onoff-node/onoff.js').Gpio;

var led = new Gpio(17, 'out');
led.writeSync(0);
led.writeSync(1);
led.writeSync(0);
 */
var http = require('http');
var https = require('https');
var url = require('url');
var os = require('os');

function performRequest(hostname, port, path, success) {
    const options = {
        hostname: hostname,
        port: port,
        path: path,
        method: 'GET'
    }
    options.headers = {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
    }
    const req = https.request(options, (res) => {
        if (res.statusCode > 300 && res.statusCode < 400 && res.headers.location) {
            var location = url.parse(res.headers.location);
            if (location.hostname) {
                return performRequest(location.hostname, location.port, location.path, success)
            } else {
                return performRequest(hostname, port, location.path, success)
            }
        }
        res.setEncoding('utf-8');
        var body = '';

        res.on('data', function (chunk) {
            body += chunk;
        }).on('end', function () {
            var responseObject = JSON.parse(body);
            success(null, responseObject);
        });

    })

    req.on('error', (error) => {
        success(error)
    })

    req.end();
}

var status = 'INIT';

/*
Temperature: 22.5
Humidity:    35%
 */
function updateStatus(cb) {
    status = 'Updating...';
    if (!oled) {
        console.log(status);
    }
    getStatus((err, data) => {
        if (err) {
            status = JSON.stringify(err);
        } else {
            var humidity = `${data.humidity < 10 ? ' ' : ''}${data.humidity}`;
            var temperatureC = `${data.temperatureC.toFixed(1)}`;
            var time = new Date().toTimeString().substr(0,5);
            status = `${temperatureC}C\n  ${humidity}%\n\n${time}`;
        }
        if (cb) {
            cb(status);
        }
        if (omegaOledText) {
            omegaOledText.init().then(function () {
                omegaOledText.writeText(status, true);
            });
        }
        console.log(status);
    });
}

function getStatus(cb) {
    function callback(error, json) {
        if (error) return cb(error)
        var thermostats = json.devices.thermostats;
        var key = Object.keys(thermostats)[0];
        var thermostat = thermostats[key];
        var temperatureC = thermostat.ambient_temperature_c;
        var humidity = thermostat.humidity;
        cb(null, {temperatureC, humidity})
    }

    performRequest(NEST_API_HOST, 443, '/', callback);
}

var apcli0 = os.networkInterfaces().apcli0;
var hostname = apcli0 && apcli0[0] ? apcli0[0].address : '0.0.0.0';
var port = 3000;
var server = http.createServer((req, res) => {
    res.statusCode = 200;
    res.setHeader('Content-Type', 'text/html');
    res.write('<pre>');
    res.write(status);
    res.write('</pre>');
    res.end();
});

server.listen(port, hostname, () => {
    console.log(`Started server at ${hostname}:${port}`)
    setInterval(updateStatus, 1000 * 60 * 20)
    updateStatus();
});
