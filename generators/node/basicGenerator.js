'use strict';

var os       = require('os');
var request  = require('request');
var _        = require('lodash');
var jsonfile = require('jsonfile');

var
  address = 'localhost',
  apiKey = '0815',
  file = 'config.json',
  protocol = 'http';

if (process.argv[2]) {
  file = process.argv[2];
}

jsonfile.readFile(file, function(err, obj) {
  if (obj.port)
    address = obj.host + ':' + obj.port;
  else
    address = obj.host;
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
    var range = Math.abs(obj.range[0] - obj.range[1]);  
    return Math.random() * range + obj.range[0];
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

    var urlStr = protocol + '://' + address + '/bvd-receiver/api/submit/' + apiKey;

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
        json: true
      },
      function(error, response, body) {
        if (error) {
          console.log('Generic Sender (post to ' + address + '): ' + error);
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