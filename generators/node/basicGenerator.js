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

/* this function can be used by value functions to generate special numbers */
global.ziggurat = function() {
  let jsr = 123456789;

  const wn = Array(128);
  const fn = Array(128);
  const kn = Array(128);

  const shr3 = function() {
    const jz = jsr;
    let jzr = jsr;

    jzr ^= jzr << 13;
    jzr ^= jzr >>> 17;
    jzr ^= jzr << 5;
    jsr = jzr;

    return (jz + jzr) | 0;
  };

  const uni = function() {
    return 0.5 * (1 + shr3() / -Math.pow(2, 31));
  };

  const nfix = function(hz, iz) {
    const r = 3.442619855899;
    const r1 = 1.0 / r;
    let x;
    let y;

    while (true) {
      x = hz * wn[iz];
      if (iz === 0) {
        x = -Math.log(uni()) * r1;
        y = -Math.log(uni());
        while (y + y < x * x) {
          x = -Math.log(uni()) * r1;
          y = -Math.log(uni());
        }

        return hz > 0 ? r + x : -r - x;
      }

      if (fn[iz] + uni() * (fn[iz - 1] - fn[iz]) < Math.exp(-0.5 * x * x)) {
        return x;
      }
      hz = shr3();
      iz = hz & 127;

      if (Math.abs(hz) < kn[iz]) {
        return hz * wn[iz];
      }
    }
  };

  const rnor = function() {
    const hz = shr3();
    const iz = hz & 127;

    return Math.abs(hz) < kn[iz] ? hz * wn[iz] : nfix(hz, iz);
  };

  this.nextGaussian = function() {
    return rnor();
  };

  const zigset = function() {
    // seed generator based on current time
    jsr ^= new Date().getTime();

    const m1 = 2147483648.0;
    let dn = 3.442619855899;
    let tn = dn;
    const vn = 9.91256303526217e-3;

    const q = vn / Math.exp(-0.5 * dn * dn);

    kn[0] = Math.floor((dn / q) * m1);
    kn[1] = 0;

    wn[0] = q / m1;
    wn[127] = dn / m1;

    fn[0] = 1.0;
    fn[127] = Math.exp(-0.5 * dn * dn);

    for (let i = 126; i >= 1; i--) {
      dn = Math.sqrt(-2.0 * Math.log(vn / dn + Math.exp(-0.5 * dn * dn)));
      kn[i + 1] = Math.floor((dn / tn) * m1);
      tn = dn;
      fn[i] = Math.exp(-0.5 * dn * dn);
      wn[i] = dn / m1;
    }
  };

  zigset();
};

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

const interpolate = function(str, data) {
  const pattern = /\$\{([^{}]*)\}/g;

  if (!data) {
    return str.replace(pattern, '');
  }

  return str.replace(pattern, (value, property) => {
    let result = data[property];

    if (result === 0) { // escape null values
      result = String(result);
    }

    return result;
  });
};

const generatePlan = function(scene, freq) {
  let plan = [],
    totalSteps = 0;

  _.forEach(scene, phase => {
    const start = phase.phase[0],
      end = phase.phase[1],
      steps = phase.steps || Math.round(phase.time / freq),
      incr = (end - start) / steps;

    totalSteps += steps;
    plan = _.concat(plan, _.times(steps, i => {
      return start + i * incr;
    }));
  });

  return {
    plan,
    totalSteps
  };
};

const generateId = function (defId) {   	
    const randId = Math.round((Math.random() * defId[1]) % 8);	
    return randId;	
}

const calcValue = function(sampleDef, sampleName, freq, data, prevSample,sample) {
  const calcRange = function(rangeDef) {
    if (rangeDef._offset === undefined) {
      rangeDef._offset = 0;
    }
    if (rangeDef._idx === undefined) {
      rangeDef._idx = -1;
    }
    if (rangeDef.trigger === undefined) {
      rangeDef._running = true;
    }
    if (rangeDef.trigger && !rangeDef._route) {
      app.get('/' + rangeDef.trigger, (req, res) => {
        if (!rangeDef._running && active) {
          rangeDef._running = true;
          console.log('######## trigger started: ' + rangeDef.trigger);
          res.send('trigger started: ' + rangeDef.trigger);
        } else if (rangeDef._running) {
          console.log('######## trigger already running: ' + rangeDef.trigger);
          res.send('trigger already running: ' + rangeDef.trigger);
        } else {
          console.log('######## generator is not active');
          res.send('generator is not active');
        }
      });
      rangeDef._route = true;
      console.log('######## route defined: ' + rangeDef.trigger);
    }
    if (rangeDef.incr && rangeDef._running) {
      rangeDef._offset += rangeDef.incr;
      rangeDef._idx += 1;
    }
    if (rangeDef._idx === rangeDef.steps) {
      rangeDef._idx = -1;
      rangeDef._offset = 0;
      if (rangeDef._route) {
        rangeDef._running = false;
        console.log('######## trigger stopped: ' + rangeDef.trigger);
      }
    }
    const range = Math.abs(rangeDef.range[0] - rangeDef.range[1]);
    let val = Math.random() * range + rangeDef.range[0] + rangeDef._offset;
    	
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

  const calcVelocity = function(veloDef, sampleName, prevSample) {
    const range = Math.abs(veloDef.velocity[2]);
    let val = (Math.random() * 2 * range) - range;
    let newVal = 0;

    if (prevSample && _.isNumber(prevSample[sampleName]))
      newVal = prevSample[sampleName] + val;

    if (newVal < veloDef.velocity[0])
      newVal = veloDef.velocity[0] + 0.5 * Math.abs(val);

    if (newVal > veloDef.velocity[1])
      newVal = veloDef.velocity[1] - 0.5 * Math.abs(val);

    if (veloDef.format) {
      if (veloDef.format === 'int') {
        newVal = Math.round(newVal + 0.5);
      } else {
        newVal = numeral(newVal).format(veloDef.format);
      }
    }

    return newVal;
  }

  const calcScene = function(sceneDef, freq) {
    sceneDef.randomness = sceneDef.randomness || 0;
    if (!sceneDef._plan) {
      const generatedPlan = generatePlan(sceneDef.scene, freq);

      sceneDef._plan = generatedPlan.plan;
      sceneDef._totalSteps = generatedPlan.totalSteps;
      sceneDef._idx = 0;
    }

    let val = (2 * Math.random() * sceneDef.randomness / 2) + sceneDef._plan[sceneDef._idx++] - sceneDef.randomness / 2;

    if (sceneDef._idx === sceneDef._totalSteps) {
      sceneDef._idx = 0;
    }
    if (sceneDef.format) {
      val = numeral(val).format(sceneDef.format);
    }

    return val;
  }; // end: calcScene

  const calcGroup = function(groupDef, freq) {
    let size = groupDef.group.size,
      changedIndex = -1;
    const change = groupDef.group.change || 'all',
      itemPattern = groupDef.group.item;

    if (_.isArray(size)) {
      size = _.random(size[0], size[1]);
    }
    if (change === 'single') {
      changedIndex = Math.floor(Math.random() * size);
    }
    let items = _.times(size, i => {
      let item = groupDef.items && groupDef.items[i] || itemPattern;

      if (i === changedIndex) {
        item = itemPattern;
      }
      item._r = item._r || {};

      return _.mapValues(item, (val, key) => {
        const result = calcValue(val, key, freq, _.merge({
          i: i
        }, item._r));

        item._r[key] = result;

        return result;
      });
    });

    groupDef.items = items;
    if (groupDef.group.sort) {
      items = _.sortBy(items, item => {
        return item[groupDef.group.sort];
      });
    }

    return items;
  }; // end: calcGroup
  
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
      console.log('Error parsing sample definition:', sampleDef, err);
    }
  }
  if (_.isFunction(evalObj)) { // if user provide callback function, use this to generate prop's value
    return evalObj(data, freq, prevSample);
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
    return function(str) {
      return eval(str);
    }.call(data, sampleDef.eval);
  }
  if (sampleDef.ith) {
    return sampleDef.ith[data.i];
  }
  if (sampleDef.range) {
    return calcRange(sampleDef);
  }
  if (sampleDef.velocity) {
    return calcVelocity(sampleDef, sampleName, prevSample);
  }
  if (sampleDef.scene) {
    return calcScene(sampleDef, freq);
  }
  if (sampleDef.group) {
    return calcGroup(sampleDef, freq);
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

const Event = function() {
  this.time = new Date().getTime();
};

const GenericSender = function(fun, delay, tolerance, dims, tags) {
  const calcDelay = function() {
    return Math.round(delay + (2 * tolerance * Math.random()) - tolerance);
  };
  let prevEvent = {};

  const sender = function(repeatFunc) {
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

  this.run = function() {
    const looper = function() {
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
        sample[sampleName] = calcValue(generator.sample[sampleName], sampleName, generator.frequency, generator._result, prevSample,sample);
        generator._result[sampleName] = sample[sampleName];
      });
    }, generator.frequency, generator.tolerance, generator.dims, generator.tags);

    sender.run();
  });
});
