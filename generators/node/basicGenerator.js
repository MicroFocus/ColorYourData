'use strict';

var os       = require('os');
var request  = require('request');
var _        = require('lodash');
var jsonfile = require('jsonfile');
var numeral  = require('numeral');

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
  port = 55123;

app.listen(port, function () {
  console.log("Listening on " + port);
});


if (process.argv[2]) {
  file = process.argv[2];
}

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
          sample[prop] = calcValue(gen.sample[prop]);
        })        
      }, gen.frequency, gen.tolerance, gen.dims, gen.tags
    );
    sender.run();
  });
})

function calcValue(obj) {
  if (_.isString(obj)) return obj;
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
      app.get('/'+obj.trigger, function(req, res) {
        if (!obj._running) {
          obj._running = true;
          res.send('trigger started: '+obj.trigger);
        }
        else {
          res.send('trigger already running: '+obj.trigger);
        }
      });
      obj._route = true;
      console.log('route defined: '+obj.trigger);
    }
    if (obj.incr && obj._running) {
      obj._offset += obj.incr;
      obj._idx++;
    }
    if (obj._idx === obj.steps) {
      obj._idx = -1;
      obj._offset = 0;
      if (obj._route)
        obj._running = false;
    }
    var range = Math.abs(obj.range[0] - obj.range[1]);  
    //console.log(JSON.stringify(obj));
    var val = Math.random() * range + obj.range[0] + obj._offset;
    if (obj.format)
      val = numeral(val).format(obj.format);
    return val;
  }
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

    console.log(JSON.stringify(evt));
    request.post({
        url : urlStr,
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

  };
  this.run = function() {
    var looper = function() {
      sender(looper);
    };
    looper();
  };
}