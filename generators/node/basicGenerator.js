'use strict';

var os = require('os');
var request = require('request');
var _ = require('lodash');
var jsonfile = require('jsonfile');
var numeral = require('numeral');

var
  address = 'localhost',
  apiKey = '0815',
  file = 'config.json',
  protocol = 'http',
  prefix;

// external trigger server
var
  express = require("express"),
  app = express(),
  port = 55123,
  active = true;

var dryrun = false;

if (process.argv[2]) {
  file = process.argv[2];
}

if (process.argv[3]) {
  port = process.argv[3];
}

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

app.listen(port, function() {
  console.log("Listening on " + port);
});

jsonfile.readFile(file, function(err, obj) {
  if (obj.port)
    address = obj.host + ':' + obj.port;
  else
    address = obj.host;
  if (obj.prefix)
    prefix = obj.prefix;
  apiKey = obj.apiKey;
  protocol = obj.protocol || protocol;
  _.each(obj.generators, function(gen) {
    var sender = new GenericSender(
      function(sample) {
        _.each(_.keys(gen.sample), function(prop) {
          sample[prop] = calcValue(gen.sample[prop], gen.frequency);
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
  try { evalObj = eval(obj); } catch (e){}
  if (_.isFunction(evalObj)) { // if user provide callback function, use this to generate prop's value
    return evalObj(freq, data);
  }
  if (_.isString(obj)) return interpolate(obj, data);
  if (_.isNumber(obj)) return obj;
  if (_.isArray(obj)) return _.sample(obj);
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
    //console.log(JSON.stringify(obj));
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
      item = obj.group.item;
    if (_.isArray(size))
      size = _.random(size[0], size[1]);
    var items = _.times(size, function(i) {
      return _.mapValues(item, function(val) {
        return calcValue(val, freq, { i: i });
      });
    });
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
