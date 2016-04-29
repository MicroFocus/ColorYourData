'use strict';

var os = require('os');
var request = require('request');
var _ = require('lodash');
var parseString = require('xml2js').parseString;

// Noise generators to get more realistic results for graph changes
// Noise is based on Perlin's implementation done for the TRON movie
var PerlinGenerator = require('proc-noise');


var
  address,
  apiKey,
  startServer = process.argv[4] !== undefined;

if (process.argv[2]) {
  address = process.argv[2];
}


var severity = ['good', 'good', 'good', 'warning', 'bad'];
var elevatorDirection = ['↑', '↓', ''];

if (process.argv[3]) {
  apiKey = process.argv[3];
}

// -------------------------------------------
// -- generic event sender --

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

function GenericSender(fun, delay, tolerance, tags, dims) {
  var calcDelay = function() {
    return Math.round(delay + (2 * tolerance * Math.random()) - tolerance);
  };
  var sender = function(repeatFunc) {
    var evt = new Event();
    fun(evt);

    var urlStr = 'http://' + address + '/api/submit/' + apiKey;
    var withQueryParams = Math.floor(Math.random() * 1000) % 2;

    if (!_.isEmpty(dims)) {
	    urlStr += '/dims/' + dims;
    }
    else {
      urlStr += '/dims/type,element';
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
          console.log('AO Bank Sender (post to ' + address + '): ' + error);
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

  this.runOnce = function() {
     sender();
  }
}


//-------------------------------------------------
//-- 1 Top Level

// Data sender
// Revenues

// Invest, Online

_.forEach(
  ['Invest', 'Online'], function(mode) {
    _.forEach(
      [
        {attribute: 'Revenue', base: 80, tol: 5},
        {attribute: 'Visitors', base: 70, tol: 10},
        {attribute: 'Systems Availability', base: 85, tol: 5}
      ], function(obj) {
        var rg = new RG();
        var dataSender = new GenericSender(
          function(evt) {
            evt.type = obj.attribute;
            evt.element = mode;
            evt.value = rg.randomValue(obj.base, obj.tol).toFixed(1);
          }, 10000, 2000, 'global'
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
      }, 12000, 1000, 'global'
    );
    dataCenterStatusSender.run();
  }
);

function databaseOnce(sev) {
  var sender = new GenericSender(
    function(evt) {
      evt.type = 'DataCenter Status';
      evt.element = 'Database';
      evt.severity = sev;
    }, 12000, 1000, 'global'
  );
  sender.runOnce();}

//---------------------------------------------------
//-- 2 Global Level

//-- Revenue & status
_.forEach(
  ['Americas', 'EMEA', 'Asia Pacific'], function(region) {
    _.forEach(
      ['Revenue'], function(attribute) {
        var rg = new RG();
        var globalDataSender = new GenericSender(
          function(evt) {
            evt.type = attribute;
            evt.element = region;
            evt.value = rg.randomValue(25, 5).toFixed(1);
          }, 12000, 2000, 'regional'
        );
        globalDataSender.run();
      }
    );
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

var h = function() {
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
                    {url: 'http://' + address + '/api/submit/' + apiKey + '?tags=newsfeed', body: rss_event, json: true},
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
  setTimeout(h, 1000 * 10);
};
h();

//----------------------------------------------------
//-- 3 Region Level - USA

//--Regional Datacenter status
_.forEach(
  [
    'WS-Apache', 'WS-IIS', 'WS-GWS', 'Sec-Internet', 'Sec-Remote Access', 'Sec-VPN', 'DB-SQL Server', 'DB-MySQL',
    'DB-Vertica', 'SAP-ERP', 'SAP-SCM', 'SAP-CRM'
  ], function(element) {
    var regionalDataCenterStatusSender = new GenericSender(
      function(evt) {
        evt.type = 'status';
        evt.element = element;
        evt.severity = _.sample(severity);
      }, 9200, 3000, 'USA'
    );
    regionalDataCenterStatusSender.run();
  }
);

//--Technology & Business status of Locations
_.forEach(
  ['San Francisco', 'Houston', 'Chicago', 'New York' , 'Las Vegas', 'Miami', 'Minneapolis', 'Seattle', 'Boise Data Center', 'Atlanta Data Center'],
  function(location) {
    _.forEach(
      ['Technology', 'Business'], function(attribute) {
        var regionalLocationDataSender = new GenericSender(
          function(evt) {
            evt.type = 'Branch Status';
            evt.element = location;
			evt.attribute = attribute;
            evt.severity = _.sample(severity);
          }, 10000, 3000, 'USA', 'type,attribute,element'
        );
        regionalLocationDataSender.run();
      }
    );
  }
);

//--Critical branches world wide - switches visibility
_.forEach(
  ['San Francisco', 'Rio De Janeiro', 'Paris', 'New York' , 'Moscow', 'Athens', 'Bangalore', 'Hong Kong', 'Melbourne'],
  function(location) {
    _.forEach(
      ['Status'], function(attribute) {
        var regionalLocationDataSender = new GenericSender(
          function(evt) {
            evt.type = 'Branch Status';
            evt.element = location;
            evt.severity = _.sample(severity);
          }, 10000, 3000, 'global'
        );
        regionalLocationDataSender.run();
      }
    );
  }
);

//---------------------------------------------------
// -- 4 Store Floor Plan

//--Cashiers
_.forEach(
  [1, 2, 3, 4, 5], function(serialnumber) {
    var cashEventSender = new GenericSender(
      function(evt) {
        evt.type = 'Cashier Transaction';
        evt.element = 'Cashier-' + serialnumber;
        evt.value = ((Math.random() * 200) + 10).toFixed(2);
      }, 10000, 3000, 'NYC store'
    );
    cashEventSender.run();
  }
);

//--ATMs
_.forEach(
  [1, 2, 3], function(serialnumber) {
    var atmEventSender = new GenericSender(
      function(evt) {
        evt.type = 'ATM Transaction';
        evt.element = 'ATM-' + serialnumber;
        evt.value = ((Math.random() * 200) + 10).toFixed(2);
        evt.severity = _.sample(severity);
      }, 10000, 3000, 'NYC store'
    );
    atmEventSender.run();
  }
);


//--Elevators
_.forEach(
  [1, 2], function(serialnumber) {
    var elevatorEventSender = new GenericSender(
      function(evt) {
        evt.type = 'Elevator Status';
        evt.element = 'ELEV-' + serialnumber;
        evt.location = 'New York';
        evt.severity = _.sample(severity);
        evt.direction = _.sample(elevatorDirection);
      }, 9000, 3000, 'NYC store'
    );
    elevatorEventSender.run();
  }
);

//--Escalators
_.forEach(
  [1, 2], function(serialnumber) {
    var escSender = new GenericSender(
      function(evt) {
        evt.type = 'Escalator Status';
        evt.element = 'ESC-' + serialnumber;
        evt.location = 'New York';
        evt.severity = _.sample(severity);
      }, 9000, 3000, 'NYC store'
    );
    escSender.run();
  }
);

//--Stairs
_.forEach(
  [1], function(serialnumber) {
    var strsSender = new GenericSender(
      function(evt) {
        evt.type = 'Stairs Status';
        evt.element = 'STRS-' + serialnumber;
        evt.location = 'New York';
        evt.severity = _.sample(severity);
      }, 9000, 3000, 'NYC store'
    );
    strsSender.run();
  }
);

//--Cameras
_.forEach(
  [1, 2, 3, 4], function(serialnumber) {
    var camSender = new GenericSender(
      function(evt) {
        evt.type = 'Camera Status';
        evt.element = 'CAM-' + serialnumber;
        evt.location = 'New York';
        evt.severity = _.sample(severity);
      }, 15000, 3000, 'NYC store'
    );
    camSender.run();
  }
);

//--Smoke Detector
_.forEach(
  [1, 2, 3, 4], function(serialnumber) {
    var smokeSender = new GenericSender(
      function(evt) {
        evt.type = 'Smoke Detector Status';
        evt.element = 'Smoke-' + serialnumber;
        evt.location = 'New York';
        evt.severity = _.sample(severity);
      }, 15000, 3000, 'NYC store'
    );
    smokeSender.run();
  }
);

//--Temperature Monitor
var tempRg = new RG();
var temperatureEventSender = new GenericSender(
  function(evt) {
    evt.type = 'Temperature';
    evt.element = 'Monitor';
    evt.value = tempRg.randomValue(21, 3).toFixed(1);

    evt.severity = 'normal';

    if (evt.value > 22.3) {
      if ((evt.value > 22.5)) {
        evt.severity = 'critical';
      } else {
        evt.severity = 'warning';
      }
    }
    else {
      if (evt.value < 20.3) {
        if (evt.value < 19) {
          evt.severity = 'critical';
        } else {
          evt.severity = 'warning';
        }
      }
    }
  }, 10000, 2000, 'NYC store'
);
temperatureEventSender.run();


//--Humidity Monitor
var humRg = new RG();
var humidityEventSender = new GenericSender(
  function(evt) {
    evt.type = 'Humidity';
    evt.element = 'Monitor';
    evt.value = humRg.randomValue(60, 4).toFixed(1);

    evt.severity = 'normal';

    if (evt.value > 61.5) {
      if ((evt.value > 63)) {
        evt.severity = 'critical';
      } else {
        evt.severity = 'warning';
      }
    }
    else {
      if (evt.value < 58.5) {
        if (evt.value < 57) {
          evt.severity = 'critical';
        } else {
          evt.severity = 'warning';
        }
      }
    }
  }, 10000, 2000, 'NYC store'
);
humidityEventSender.run();

//--Customer Tracker
var custRg = new RG(0, 2, 20);
var customerCheckInEventSender = new GenericSender(
  function(evt) {
    evt.type = 'Customer Tracker';
    evt.element = 'Counter';
    //Number of customers checked in
    var customerHeadCounts = Math.round(custRg.nextMonotoneWithSparks());
    evt.value = customerHeadCounts;
    evt.unit = 'Numbers';
    evt.direction = Math.random() > 0.5 ? 'in' : 'out';
    if (customerHeadCounts >= 0) {
      evt.severity = 'good';
    }
    if (customerHeadCounts > 10) {
      evt.severity = 'warning';
    }
    if (customerHeadCounts > 20) {
      evt.severity = 'bad';
    }
  }, 10000, 4000, 'NYC store'
);
customerCheckInEventSender.run();

//--Anti-Theft System
var antiTheftRg = new RG(0, 2, 20);
var antiTheftEventSender = new GenericSender(
  function(evt) {
    evt.type = 'Anti-Theft System';
    evt.element = 'Status';
    var systemStatus = Math.round(antiTheftRg.nextMonotoneWithSparks());
    if (systemStatus >= 0) {
      evt.status = 'good';
    }
    else {
      if ((systemStatus > 10)) {
        evt.status = 'warning';
      }
      else {
        evt.status = 'bad';
      }
    }
  }, 10000, 4000, 'NYC store'
);
antiTheftEventSender.run();


//-------------------------------------------------------------------
//-- Region Distribution donut chart

(function() {
  var rg = new RG();
  var regionDistribution = new GenericSender(
    function(evt) {
      evt.type     = 'Region Distribution';
      evt.emea     = Math.round(rg.randomValue(40, 10));
      evt.americas = Math.round(rg.randomValue(30, 10));
      evt.asia     = 100-(evt.emea+evt.americas);
    }, 10000, 2000, 'global', 'type'
  );
  regionDistribution.run();
})();

