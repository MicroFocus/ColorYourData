'use strict';

/* eslint-disable no-console, no-process-exit, line-comment-position, sort-vars, no-eval */

const request = require('request');
const _ = require('lodash');
const jsonfile = require('jsonfile');
const numeral = require('numeral');
const dashdash = require('dashdash');

const parserOptions = [{
    names: ['help', 'h'],
    type: 'bool',
    help: 'Print this help and exit.'
}, {
    names: ['key', 'k'],
    type: 'string',
    help: 'Override API key from config file.',
    helpArg: 'KEY'
}, {
    names: ['protocol', 'p'],
    type: 'string',
    help: 'Override protocol (http/https) from config file.',

    // default: 'http',
    helpArg: 'PROT'
}, {
    names: ['noprefix', 'n'],
    type: 'bool',
    help: 'Don\'t use an URL prefix. Default is using bvd-receiver',
    default: false
}, {
    names: ['address', 'a'],
    type: 'string',
    help: 'Override address (name or IP and optional port) from config file.',

    // default: 'localhost',
    helpArg: 'ADDR'
}, {
    names: ['file', 'f'],
    type: 'string',
    help: 'Config file to process',
    helpArg: 'FILE'
}, {
    names: ['trigger', 't'],
    type: 'integer',
    help: 'Listening port for external trigger.',

    // default: 55123,
    // hidden: true,
    helpArg: 'PORT'
}, {
    names: ['debug', 'd'],
    type: 'bool',
    hidden: true,
    default: false
}];



const parser = dashdash.createParser({
    options: parserOptions
});

let cmdLineOpts;

try {
    cmdLineOpts = parser.parse(process.argv);
} catch (err) {
    console.error('foo: error: %s', err.message);
    process.exit(1);
}

if (!cmdLineOpts.file || cmdLineOpts.help) {
    const help = parser.help({
        includeEnv: true
    }).trimRight();

    console.log('usage: node basicGenerator.js [OPTIONS]\n' +
        'options:\n' +
        help);
    process.exit(0);
}

/* external trigger server */
const express = require('express');
const app = express(),
    port = cmdLineOpts.trigger;
let active = true;

const dryrun = false;

let address,
    apiKey,
    protocol,
    prefix;
const file = cmdLineOpts.file;

app.get('/on', (req, res) => {
    active = true;
    console.log('Generator is on, ' + port);
    res.send('Generator is on, ' + port);
});

app.get('/off', (req, res) => {
    active = false;
    console.log('Generator is off, ' + port);
    res.send('Generator is off, ' + port);
});

if (_.isNumber(port)) {
    app.listen(port, () => {
        console.log('Listening on ' + port);
    });
}

const generateId = function (defId) {   
    const randId = Math.round((Math.random() * defId[1]) % 8);
    return randId;
}
const calcValue = function (sampleDef, sampleName, freq, data, prevValue, sample) {
    const calcRange = function (rangeDef) {     
       //console.log('sample name is ',sampleName);
        const range = Math.abs(rangeDef.range[0] - rangeDef.range[1]);
        let val;
        switch(sampleName) {
            case "numberOfCritical" :
               val = (Math.random() * range) % 2 ;
               break;
            case "numberOfMajor" :
               val = (Math.random() * range ) % 4 ;
               break;
            case "numberOfMinor" :
               val = (Math.random() * range) % 8 ;
               break;
            case "numberOfNormal" :
               val = (Math.random() * range) % 10 ;
               break;
            case "numberOfUnknown" :
                val = (Math.random() * 4);
                break;
        }
        
        if (rangeDef.format) {
            if (rangeDef.format === 'int') {
                val = Math.round(val + 0.5);
            } else {
                val = numeral(val).format(rangeDef.format);
            }
        }

        return val;
    }; // end: calcRange

    const calcMostCritical = function (statusDef, sampleData) {

        if (sampleData.numberOfCritical > 0)
            return "CRITICAL";
        else if (sampleData.numberOfMajor > 0)
            return "MAJOR";
        else if (sampleData.numberOfMinor > 0)
            return "MINOR";
        else
            return "NORMAL";


    }// end: calcMostCritical

    const calcStatus = function (sampleDef) {
        const id = generateId(sampleDef.GetStatus.Id);
        var res = "Unknown";
        switch (id) {      
            case 0:
                res = "Critical";
                break;
            case 1:
                res = "Major";
                break;
            case 2:
                res = "Minor";
                break;
            case 3:
                res = "Warning";
                break;
            case 4:
                res = "Info";
                break;
            case 5:
                res = "OK";
                break;
            case 6:
                res = "Downtime";
                break;
            case 7:
                res = "No Data";
                break;
            default :
                res = "Unknown";
                break;  
        }
        return res;

    } // end: calcStatus


    let evalObj;

    try {
        if (_.isString(sampleDef)) {
            evalObj = eval('(' + sampleDef + ')');
        }
    } catch (err) {
        if (cmdLineOpts.debug) {
            // console.log('Error parsing sample definition:', sampleDef, err);
        }
    }
    if (_.isFunction(evalObj)) { // if user provide callback function, use this to generate prop's value
        return evalObj(data, freq, prevValue);
    }
    if (_.isString(sampleDef)) {
        return interpolate(sampleDef, data);
    }
    if (_.isNumber(sampleDef)) {
        return sampleDef;
    }
    if (_.isArray(sampleDef)) {
        return _.sample(sampleDef);
    }
    if (sampleDef.eval) {
        return function (str) {
            return eval(str);
        }.call(data, sampleDef.eval);
    }
    if (sampleDef.ith) {
        return sampleDef.ith[data.i];
    }
    if (sampleDef.range) {
        return calcRange(sampleDef);
    }
    if (sampleDef.GetMostCritical) {
        return calcMostCritical(sampleDef, sample);
    }

    if (sampleDef.GetStatus) {
       
        return calcStatus(sampleDef);
    }

}; // end: calcValue



// -------------------------------------------
// -- generic sender --

const Event = function () {
    this.time = new Date().getTime();
};

const GenericSender = function (fun, delay, tolerance, dims, tags) {
    const calcDelay = function () {
        return Math.round(delay + (2 * tolerance * Math.random()) - tolerance);
    };
    let prevEvent = {};

    const sender = function (repeatFunc) {
        const evt = new Event();

        fun(evt, prevEvent);

        let urlStr = protocol + '://' + address;

        if (prefix) {
            urlStr += '/' + prefix;
        }
        urlStr += '/api/submit/' + apiKey;

        if (!_.isEmpty(dims)) {
            urlStr += '/dims/' + dims;
        }

        if (!_.isEmpty(tags)) {
            urlStr += '/tags/' + tags;
        }

        if (active) {
            console.log(JSON.stringify(evt));
            prevEvent = evt;
            if (!dryrun) {
                request.post({
                    url: urlStr,
                    headers: {
                        'X-ApiKey': apiKey
                    },
                    body: evt,
                    json: true,
                    rejectUnauthorized: false
                }, (error, response, body) => {
                    if (error) {
                        console.log('Generic Sender (post to ' + urlStr + '): ' + error);
                    } else if (response.statusCode !== 200) {
                        console.log(JSON.stringify(body));
                        console.log(urlStr);
                    }
                    repeatFunc && setTimeout(repeatFunc, calcDelay());
                });
            } else {
                repeatFunc && setTimeout(repeatFunc, calcDelay());
            }
        } else {
            repeatFunc && setTimeout(repeatFunc, calcDelay());
        }
    };

    this.run = function () {
        const looper = function () {
            sender(looper);
        };

        looper();
    };
}; // end: GenericSender

/* Start parsing of JSON file */
jsonfile.readFile(file, (err, obj) => {
    address = 'localhost';
    if (obj.host) {
        address = obj.host;
    }
    if (obj.port && obj.host) {
        address = obj.host + ':' + obj.port;
    }
    if (cmdLineOpts.address) {
        address = cmdLineOpts.address;
    }

    prefix = cmdLineOpts.noprefix ? '' : obj.prefix || 'bvd-receiver';
    apiKey = cmdLineOpts.key || obj.apiKey;
    protocol = cmdLineOpts.protocol || obj.protocol || 'http';
    _.each(obj.generators, generator => {
        generator._result = generator._result || {};
        const sender = new GenericSender((sample, prevSample) => {
            _.each(_.keys(generator.sample), sampleName => {

                sample[sampleName] = calcValue(generator.sample[sampleName], sampleName, generator.frequency, generator._result, prevSample, sample);
                generator._result[sampleName] = sample[sampleName];
            });
        }, generator.frequency, generator.tolerance, generator.dims, generator.tags);

        sender.run();
    });
});
