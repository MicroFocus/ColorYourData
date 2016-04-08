'use strict';

var os = require('os');
var request = require('request');
var _ = require('lodash');
var parseString = require('xml2js').parseString;

// Noise generators to get more realistic results for graph changes
// Noise is based on Perlin's implementation done for the TRON movie
var PerlinGenerator = require('proc-noise');

var
  address = 'localhost',
  apiKey = '0815';

if (process.argv[2]) {
  address = process.argv[2];
}
if (process.argv[3]) {
  apiKey = process.argv[3];
}

// to get some IT status values
var severity = ['good', 'good', 'good', 'warning', 'bad'];

// -------------------------------------------
// -- generic sender --

function Event() {
  this.time = new Date().getTime();
}

function RG(start, growth, end) {
  var that = this;
  var seed = Math.random() * 100;
  var perlin = new PerlinGenerator();
  var current = start;
  var n = 0;
  this.next = function() {
    return perlin.noise(seed++);
  };
  this.randomValue = function(base, tolerance) {
    return base + (2 * tolerance * that.next()) - tolerance;
  };
  this.nextMonotone = function() {
    var last = current;
    current += (growth * that.next());
    if (current > end) {
      current = start;
    }
    return last;
  };

  this.nextMonotoneWithSparks = function() {
    var last = current;
    current += (growth * that.next());
    if (current > end) {
      current = start;
    }
    if ((n++ % 17) == 0 && Math.random() > 0.5) {
      current = last;
      last = this.randomValue(current + (end - start), end - start);
    }
    return last;
  }
}

function GenericSender(fun, delay, tolerance, dims, tags) {
  var calcDelay = function() {
    return Math.round(delay + (2 * tolerance * Math.random()) - tolerance);
  };
  var sender = function(repeatFunc) {
    var evt = new Event();
    fun(evt);

    var urlStr = 'http://' + address + '/api/submit/' + apiKey;

    if (!_.isEmpty(dims)) {
	    urlStr += '/dims/' + dims;
    }

    if (!_.isEmpty(tags)) {
      urlStr += '/tags/' + tags;
    }

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


//-------------------------------------------------
//-- Create some business like numbers
//-- Drive 6 charts


_.forEach(
  ['Invest', 'Online'], function(cat) {
    _.forEach(
      [
        {type: 'Revenue', base: 80, tol: 5},
        {type: 'Visitors', base: 70, tol: 10},
        {type: 'Systems Availability', base: 85, tol: 5}
      ], function(obj) {
        var rg = new RG();
        var dataSender = new GenericSender(
          function(evt) {
            evt.type = obj.type;
            evt.category = cat;
            evt.value = rg.randomValue(obj.base, obj.tol).toFixed(1);
          }, 10000, 2000, 'type,category'
        );
        dataSender.run();
      }
    );
  }
);

//--Data Center Status
_.forEach(
  ['Web Server', 'Database', 'SAP'], function(element) {
    var dataCenterStatusSender = new GenericSender(
      function(evt) {
        evt.type = 'DataCenter Status';
        evt.element = element;
        evt.severity = _.sample(severity);
      }, 12000, 1000, 'element'
    );
    dataCenterStatusSender.run();
  }
);


//-- News Feed
var rss_event = {
  time : 0,
  type : 'test',
  tags : ['rss'],
  title: '',
  link : ''
};

// pick some random items from CNN's rss feed

var cnn = function() {
  request.get(
    {url: 'http://rss.cnn.com/rss/cnn_latest.rss'},
    function(error, response, body) {
      if (error) {
        console.log('rss reader (get): ' + error);
      } else {
        parseString(
          body, function(error, result) {
            if (error) {
              console.log('rss reader (parse): ' + error);
            } else {
              try {
                var randomItemId = Math.floor(Math.random() * result['rss']['channel'][0]['item'].length),
                    randomItem = result['rss']['channel'][0]['item'][randomItemId];

                if (rss_event.title != randomItem.title[0]) {
                  rss_event.title = randomItem.title[0];
                  rss_event.link = randomItem.link[0];
                  rss_event.time = new Date().getTime();
                  request.post(
                    {url: 'http://' + address + '/api/submit/' + apiKey + '?tags=cnn', body: rss_event, json: true},
                    function(error, response, body) {
                      if (error) {
                        console.log('rss reader (post): ' + error);
                      }
                    }
                  );
                }

              } catch (e) {
                console.log(e);
              }
            }
          }
        );
      }
    }
  );
  setTimeout(cnn, 1000 * 10);
};
cnn();



