Data generator using Node.js (JavaScript)

This directory contains a basic generator and example subfolders along with specific generator config files and corresponding Visio files

## Installing
Install [Nodejs](https://nodejs.org).

Make sure to set your proxy (http_proxy, https_proxy and no_proxy) according to your environment.

Download the repository into a fresh work space, cd into the node subdirectory of this repo (generators/node) and run
<pre>
npm install
</pre>

## Basic data generator

### Running
<pre>
node basicGenerator.js [OPTIONS]
</pre>
where OPTIONS is one or more from
<pre>
    -h, --help                Print this help and exit.
    -k KEY, --key=KEY         Override API key from config file.
    -p PROT, --protocol=PROT  Override protocol (http/https) from config file.
    -a ADDR, --address=ADDR   Override address (name or IP and optional port)
                              from config file.
    -f FILE, --file=FILE      Config file to process.
    -t PORT, --trigger=PORT   Listening port for external trigger.
</pre>
Specify a config file with basic info like host, port, protocol and API key, plus add a list of generators with samples and update frequency.
See config.json for an example.
Most options from the config file can be overridden by comannd line options as shown above.

If no config file name is specified, the default is config.json.

The trigger-port is used to spawn the trigger listener. Default is port 55123. Triggers can be specified as described below. Two default triggers /on and /off are always active. Per default all generators are on and can be muted with the /off trigger.

### Config file format
```json
{
  "host": "localhost",
  "prefix": "bvd-receiver",
  "port": 443,
  "protocol": "https",
  "apiKey": "081508150815081508150815",
  "generators": [
    {
      "name":"Range fluid value",
      "sample": {
        "value": {
          "range": [0,100]
          }
      },
      "frequency": 5000,
      "tolerance": 500,
      "tags":"sample",
      "dims":"host,metric"
    }
  ]
}
```

* `host`: BVD receiver hostname to send the samples to
* `port`: Listening port of the BVD receiver
* `prefix`: The part of the BVD receiver URL which is between the hostname and `/api/submit` e.g. `http://www.example.com/bvd-receiver/api/submit/<apikey>`
* `protocol`: Transfer protocol. Either `http` or `https`
* `apiKey`: BVD API Key as displayed in the BVD UI
* `generators`: An array of data generators as descibed below

### Data generator
A data generator describes one or multiple BVD data channels which are generated with a certain data format.

#### Default properties
* `name`: The name of this data generator
* `sample`: The data generation rules as described below
* `frequency` and `tolerance`: The frequency this data generator will send data to BVD and its random maximum deviation from this frequency.
* `tags`: The tags of this data generator
* `dims`: The dimensions

### Describing values

Values can be generated in multiple ways:

#### Simple value range:
```json
"value": {"range": [0,100]}
```
This will generate float numbers between 0 and 100.

#### Value out of a list:
```json
"value": ["good", "bad", "medium"]
```
This will pick a random value out of this list.

#### Range with auto increment
As value range with auto increment by give value (incr) and number of steps (steps). After the number of steps the offset will be reset to 0. The growing offset will be added to the random value out of the range array:
```json
"value": {"range": [70,80], "incr": 5, "steps": 10}
```

The incremental change of values normally starts with the start of the generator and loops over the steps. The start can be triggered by calling a trigger URL using curl or your browser. To do that specify an additional trigger property like so:
```json
"value": {"range": [70,80], "incr": 5, "steps": 10, "trigger": "foo"}
```
With this setup a call of <code>http://localhost:55123/foo</code> will start the increment once for the given number of steps.

Please note: Triggers are uniqe. You cannot use the same trigger name multiple times.

#### Describing Scenes
Scenes allow you to specify sequences of value changes, so-called phases. Phases have a start and end value plus a period in which the value changes from start to end linearly. The period can be a number of steps or a time in milli seconds. When using a time period, please be aware that the calculation is based on the frequency of the generator. The tolerance value is ignored. This can be an issue if you plan to synchronize multiple generators with different frequencies. Here is an example:
```json
"value": {
  "scene": [
    {"phase": [10,10], "steps": 10},
    {"phase": [10,20], "time":  3000},
    {"phase": [20,10], "steps": 10}],
  "format": "0.0",
  "randomness": 2}
```

It does the following: for 10 steps stay on a baseline value of 10 with randomness 2 (i.e. between 10 and 12). Then describe an upramp from 10 to 20 within 3 seconds and finally a downramp back to 10 in 10 steps. All numbers will get the same randomness and formatting.

After the above 30 steps the scene starts over

#### Describing Groups
With the new widget group we need a way to fill an items property with an array of samples that make the group.
The following snippet shows all features to describe groups:
```json
"items": {
  "group": {
    "item": {
      "id": "Service_${i}",
      "severity": ["green", "yellow", "red" ],
      "performance": {
        "range": [10, 90],
        "format": "0.0"
      }
    },
    "size": [4, 6],
    "sort": "performance"
  },
  "format": "0.0",
  "randomness": 2
}
```

items is the actual property. Currently the name is fixed and it has to be named "items".
Group introduces a group, with the item definition below. Inside an item the same value logic as above applies. Besides the item itself, you can control the number of items by assigning a fixed number to the size property or a range where the actual size will be a random integer inside the given range. Finally the optional sort propery sorts the items array according to the given property.

The above snippet produces samples with a random size items list, where each item contains an id, a severity and a performance float value. The specified format and randomness at the end are applied to the value calculation inside the items.

#### Formatting numerical values
The format of a numerical output can be controlled by a format string via the <code>format</code> property. Formatting makes use of the numeral.js package. E.g. 0.00 formats a number to two decimal digits. Or the value `"int"`can be used to generate an integer value.

#### Callback function to define values
We can provide callback function that return a value for a particular property. The callback function must be written in a string which then will be evaluated by generator. Three values get passed to this function:
* `data`: the data already generated to be sent
* `freq`: the frequency configured for this sender
* `prevSample`: the last data generated. Can be used to generate data based on the previously generated data.

This example will calculate a severity based on a value:
```
{
  ...
  "severity": "(function (data, freq, prevSample) { if (data.value <= 50) {return 'normal';} if (data.value <= 80) {return 'warning';} return 'error';})",
 ...
}
```

#### URL prefix
Starting with BVD 10.61 (containerized BVD), the receiver URL needs a prefix: <code>bvd-receiver</code>. This can be specified with the optional property <code>prefix</code>.

#### Using HTTP(s) proxies
In case you need to specify a proxy, please do so using environment variables like
<pre>
HTTP_PROXY / http_proxy
HTTPS_PROXY / https_proxy
</pre>

## AO-Bank sample data generator
### Running
<pre>
node ao_bank_gen.js host:port ApiKey
</pre>
This generator drives the AO-Bank sample dashboards available from the
[Micro Focus Marketplace](https://marketplace.microfocus.com/itom/category/opsb?product=Business%20Value%20Dashboard&version=All%20versions&company=All%20companies)

## config file for OBM sample dasboard
### Running
User can download the data generator executable files for Windows, Linux and MacOS from the repository.
<pre>
basicGenerator -f obmConfig.json
</pre>
This config file drives the sample OBM dashboard available from the [Micro Focus Marketplace](https://marketplace.microfocus.com/itom/category/opsb?product=Business%20Value%20Dashboard&version=All%20versions&company=All%20companies)



