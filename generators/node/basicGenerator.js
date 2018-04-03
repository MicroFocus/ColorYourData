'use strict';

var os = require('os');
var request = require('request');
var _ = require('lodash');
var jsonfile = require('jsonfile');
var numeral = require('numeral');
var dd = require('dashdash');
var global = {};

var options = [
  {
    names: ['help', 'h'],
    type: 'bool',
    help: 'Print this help and exit.'
  },
  {
    names: ['key', 'k'],
    type: 'string',
    help: 'Override API key from config file.',
    helpArg: 'KEY'
  },
  {
    names: ['protocol', 'p'],
    type: 'string',
    help: 'Override protocol (http/https) from config file.',
    //default: 'http',
    helpArg: 'PROT'
  },
  {
    names: ['noprefix', 'n'],
    type: 'bool',
    help: "Don't use an URL prefix. Default is using bvd-receiver",
    default: false
  },
  {
    names: ['address', 'a'],
    type: 'string',
    help: 'Override address (name or IP and optional port) from config file.',
    //default: 'localhost',
    helpArg: 'ADDR'
  },
  {
    names: ['file', 'f'],
    type: 'string',
    help: 'Config file to process',
    helpArg: 'FILE'
  },
  {
    names: ['trigger', 't'],
    type: 'integer',
    help: 'Listening port for external trigger.',
    //default: 55123,
    //hidden: true,
    helpArg: 'PORT'
  }
];

global.ziggurat = function() {

  var jsr = 123456789;

  var wn = Array(128);
  var fn = Array(128);
  var kn = Array(128);

  function RNOR() {
    var hz = SHR3();
    var iz = hz & 127;
    return (Math.abs(hz) < kn[iz]) ? hz * wn[iz] : nfix(hz, iz);
  }

  this.nextGaussian = function() {
    return RNOR();
  }

  function nfix(hz, iz) {
    var r = 3.442619855899;
    var r1 = 1.0 / r;
    var x;
    var y;
    while (true) {
      x = hz * wn[iz];
      if (iz == 0) {
        x = (-Math.log(UNI()) * r1);
        y = -Math.log(UNI());
        while (y + y < x * x) {
          x = (-Math.log(UNI()) * r1);
          y = -Math.log(UNI());
        }
        return (hz > 0) ? r + x : -r - x;
      }

      if (fn[iz] + UNI() * (fn[iz - 1] - fn[iz]) < Math.exp(-0.5 * x * x)) {
        return x;
      }
      hz = SHR3();
      iz = hz & 127;

      if (Math.abs(hz) < kn[iz]) {
        return (hz * wn[iz]);
      }
    }
  }

  function SHR3() {
    var jz = jsr;
    var jzr = jsr;
    jzr ^= (jzr << 13);
    jzr ^= (jzr >>> 17);
    jzr ^= (jzr << 5);
    jsr = jzr;
    return (jz + jzr) | 0;
  }

  function UNI() {
    return 0.5 * (1 + SHR3() / -Math.pow(2, 31));
  }

  function zigset() {
    // seed generator based on current time
    jsr ^= new Date().getTime();

    var m1 = 2147483648.0;
    var dn = 3.442619855899;
    var tn = dn;
    var vn = 9.91256303526217e-3;

    var q = vn / Math.exp(-0.5 * dn * dn);
    kn[0] = Math.floor((dn / q) * m1);
    kn[1] = 0;

    wn[0] = q / m1;
    wn[127] = dn / m1;

    fn[0] = 1.0;
    fn[127] = Math.exp(-0.5 * dn * dn);

    for (var i = 126; i >= 1; i--) {
      dn = Math.sqrt(-2.0 * Math.log(vn / dn + Math.exp(-0.5 * dn * dn)));
      kn[i + 1] = Math.floor((dn / tn) * m1);
      tn = dn;
      fn[i] = Math.exp(-0.5 * dn * dn);
      wn[i] = dn / m1;
    }
  }
  zigset();
};

var parser = dd.createParser({ options: options });
try {
  var opts = parser.parse(process.argv);
} catch (e) {
  console.error('foo: error: %s', e.message);
  process.exit(1);
}

if (!opts.file || opts.help) {
  var help = parser.help({ includeEnv: true }).trimRight();
  console.log('usage: node basicGenerator.js [OPTIONS]\n'
    + 'options:\n'
    + help);
  process.exit(0);
}


// external trigger server
var
  express = require("express"),
  app = express(),
  port = opts.trigger,
  active = true;

var dryrun = false;

var
  address,
  apiKey,
  file = opts.file,
  protocol,
  prefix;

app.get('/on', function(req, res) {
  active = true;
  console.log('Generator is on, ' + port);
  res.send('Generator is on, ' + port);
});

app.get('/off', function(req, res) {
  active = false;
  console.log('Generator is off, ' + port);
  res.send('Generator is off, ' + port);
});

if (_.isNumber(port)) {
  app.listen(port, function() {
    console.log("Listening on " + port);
  });
}

jsonfile.readFile(file, function(err, obj) {
  address = 'localhost';
  if (obj.host)
    address = obj.host;
  if (obj.port && obj.host)
    address = obj.host + ':' + obj.port;
  if (opts.address)
    address = opts.address;

  prefix = opts.noprefix ? '' : obj.prefix || 'bvd-receiver';
  apiKey = opts.key || obj.apiKey;
  protocol = opts.protocol || obj.protocol || 'http';
  _.each(obj.generators, function(gen) {
    gen._r = gen._r || {};
    var sender = new GenericSender(
      function(sample) {
        _.each(_.keys(gen.sample), function(prop) {
          sample[prop] = calcValue(gen.sample[prop], gen.frequency, gen._r);
          gen._r[prop] = sample[prop];
        })
      }, gen.frequency, gen.tolerance, gen.dims, gen.tags
    );
    sender.run();
  });
})

function interpolate(str, data) {
  var pattern = /\$\{([^{}]*)\}/g;
  if (!data) {
    return str.replace(pattern, '');
  }

  return str.replace(pattern, function(value, property) {
    var result = data[property];

    if (result === 0) { // escape null values
      result = String(result);
    }

    return result;
  });
}


function calcValue(obj, freq, data) {
  var evalObj;
  try {
    if (_.isString(obj)) {
      evalObj = eval('(' + obj + ')');
    }
  } catch (e) {
    // console.log(e);
  }
  if (_.isFunction(evalObj)) { // if user provide callback function, use this to generate prop's value
    return evalObj(data, freq);
  }
  if (_.isString(obj)) return interpolate(obj, data);
  if (_.isNumber(obj)) return obj;
  if (_.isArray(obj)) return _.sample(obj);
  if (obj.eval) {
    return (function(str) {
      return eval(str);
    }).call(data, obj.eval);
  }
  if (obj.ith) {
    return obj.ith[data.i];
  }
  if (obj.range) {
    if (obj._offset == undefined)
      obj._offset = 0;
    if (obj._idx == undefined)
      obj._idx = -1;
    if (obj.trigger == undefined)
      obj._running = true;
    if (obj.trigger && !obj._route) {
      app.get('/' + obj.trigger, function(req, res) {
        if (!obj._running && active) {
          obj._running = true;
          console.log('######## trigger started: ' + obj.trigger);
          res.send('trigger started: ' + obj.trigger);
        }
        else {
          if (obj._running) {
            console.log('######## trigger already running: ' + obj.trigger);
            res.send('trigger already running: ' + obj.trigger);
          }
          else {
            console.log('######## generator is not active');
            res.send('generator is not active');
          }
        }
      });
      obj._route = true;
      console.log('######## route defined: ' + obj.trigger);
    }
    if (obj.incr && obj._running) {
      obj._offset += obj.incr;
      obj._idx++;
    }
    if (obj._idx === obj.steps) {
      obj._idx = -1;
      obj._offset = 0;
      if (obj._route) {
        obj._running = false;
        console.log('######## trigger stopped: ' + obj.trigger);
      }
    }
    var range = Math.abs(obj.range[0] - obj.range[1]);
    var val = Math.random() * range + obj.range[0] + obj._offset;
    if (obj.format)
      val = numeral(val).format(obj.format);
    return val;
  }
  if (obj.scene) {
    obj.randomness = obj.randomness || 0;
    if (!obj._plan) {
      var r = generatePlan(obj.scene, freq);
      obj._plan = r.plan;
      obj._totalSteps = r.totalSteps
      obj._idx = 0;
    }

    var val = (2 * Math.random() * obj.randomness / 2) + obj._plan[obj._idx++] - obj.randomness / 2;
    if (obj._idx == obj._totalSteps)
      obj._idx = 0;
    if (obj.format)
      val = numeral(val).format(obj.format);
    //console.log(JSON.stringify(obj));
    return val;
  }
  if (obj.group) {
    var
      size = obj.group.size,
      itemPattern = obj.group.item,
      changedIndex = -1,
      change = obj.group.change || 'all';

    if (_.isArray(size)) {
      size = _.random(size[0], size[1]);
    }
    if (change === 'single')
      changedIndex = Math.floor(Math.random() * size);
    var items = _.times(size, function(i) {
      var item = obj.items && obj.items[i] || itemPattern;
      if (i === changedIndex)
        item = itemPattern;
      item._r = item._r || {};
      return _.mapValues(item, function(val, key) {
        var r = calcValue(val, freq, _.merge({ i: i }, item._r));
        item._r[key] = r;
        return r;
      });
    });
    obj.items = items;
    if (obj.group.sort) {
      items = _.sortBy(items, function(o) { return o[obj.group.sort] });
    }
    return items;
  }
}

function generatePlan(scene, freq) {
  var
    plan = [],
    totalSteps = 0;

  _.forEach(scene, (phase) => {
    var
      start = phase.phase[0],
      end = phase.phase[1],
      steps = phase.steps || Math.round(phase.time / freq),
      incr = (end - start) / steps;

    totalSteps += steps;
    plan = _.concat(plan, _.times(steps, (i) => { return start + i * incr; }));
  });
  return { plan, totalSteps };
}

// -------------------------------------------
// -- generic sender --

function Event() {
  this.time = new Date().getTime();
}

function GenericSender(fun, delay, tolerance, dims, tags) {
  var calcDelay = function() {
    return Math.round(delay + (2 * tolerance * Math.random()) - tolerance);
  };
  var sender = function(repeatFunc) {
    var evt = new Event();
    fun(evt);

    var urlStr = protocol + '://' + address;
    if (prefix)
      urlStr += '/' + prefix;
    urlStr += '/api/submit/' + apiKey;

    if (!_.isEmpty(dims)) {
      urlStr += '/dims/' + dims;
    }

    if (!_.isEmpty(tags)) {
      urlStr += '/tags/' + tags;
    }

    if (active) {
      console.log(JSON.stringify(evt));
      if (!dryrun) {
        request.post({
          url: urlStr,
          headers: {
            'X-ApiKey': apiKey
          },
          body: evt,
          json: true,
          rejectUnauthorized: false
        },
          function(error, response, body) {
            if (error) {
              console.log('Generic Sender (post to ' + urlStr + '): ' + error);
            } else {
              if (response.statusCode != 200) {
                console.log(JSON.stringify(body));
                console.log(urlStr);
              }
            }
            repeatFunc && setTimeout(repeatFunc, calcDelay());
          }
        );
      }
      else {
        repeatFunc && setTimeout(repeatFunc, calcDelay());
      }
    }
    else {
      repeatFunc && setTimeout(repeatFunc, calcDelay());
    }

  };
  this.run = function() {
    var looper = function() {
      sender(looper);
    };
    looper();
  };
}
