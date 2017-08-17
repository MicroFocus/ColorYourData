Data generator using Node.js
## Installing
Download the repository, cd into the node directory and run
<pre>
npm install
</pre>

## Basic data generator

### Running
<pre>
node basicGenerator.js config_file.json [trigger-port]
</pre>
Specify a config file with basic info like host, port, protocol and API key,
plus add a list of generators with samples and update frequency.
See config.json for an example.
If you omit the port it will use the default according to the protocol.
If you omit the protocol, http is used.

The optional trigger-port is used to spawn the trigger listener. Default is port 55123. Triggers can be specified as described below. Two default triggers /on and /off are always active. Per default all generators are on and can be muted with the /off trigger.

### Describing values

Values can be generated in multiple ways:

#### Simple value range:
<pre>
"value": {"range": [0,100]}
</pre>
#### Value out of a list:
<pre>
"value": ["good", "bad", "medium"]
</pre>
#### Range with auto increment
As value range with auto increment by give value (incr) and number of steps (steps). After the number of steps the offset will be reset to 0. The growing offset will be added to the random value out of the range array:
<pre>
"value": {"range": [70,80], "incr": 5, "steps": 10}
</pre>

The incremental change of values normally starts with the start of the generator and loops over the steps. The start can be triggered by calling a trigger URL using curl or your browser. To do that specify an additional trigger property like so:
<pre>
"value": {"range": [70,80], "incr": 5, "steps": 10, "trigger": "foo"}
</pre>
With this setup a call of <code>http://localhost:55123/foo</code> will start the increment once for the given number of steps.

Please note: Triggers are uniqe. You cannot use the same trigger name multiple times.

#### Describing Scenes
Scenes allow you to specify sequences of value changes, so-called phases. Phases have a start and end value plus a period in which the value changes from start to end linearly. The period can be a number of steps or a time in milli seconds. When using a time period, please be aware that the calculation is based on the frequency of the generator. The tolerance value is ignored. This can be an issue if you plan to synchronize multiple generators with different frequencies. Here is an example:
<pre>
"value": {
  "scene": [
    {"phase": [10,10], "steps": 10},
    {"phase": [10,20], "time":  3000},
    {"phase": [20,10], "steps": 10}],
  "format": "0.0",
  "randomness": 2}
</pre>

It does the following: for 10 steps stay on a baseline value of 10 with randomness 2 (i.e. between 10 and 12). Then describe an upramp from 10 to 20 within 3 seconds and finally a downramp back to 10 in 10 steps. All numbers will get the same randomness and formatting.

After the above 30 steps the scene starts over

#### Describing Groups
With the new widget group we need a way to fill an items property with an array of samples that make the group.
The following snippet shows all features to describe groups:
<pre>
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
</pre>

items is the actual property. Currently the name is fixed and it has to be named "items".
Group introduces a group, with the item definition below. Inside an item the same value logic as above applies. Besides the item itself, you can control the number of items by assigning a fixed number to the size property or a range where the actual size will be a random integer inside the given range. Finally the optional sort propery sorts the items array according to the given property.

The above snippet produces samples with a random size items list, where each item contains an id, a severity and a performance float value. The specified format and randomness at the end are applied to the value calculation inside the items.

#### Formatting numerical values
The format of a numerical output can be controlled by a format string via the <code>format</code> property. Formatting makes use of the numeral.js package. E.g. 0.00 formats a number to two decimal digits.

#### Callback function to define values
We can provide callback function that return a value for a particular property. The callback function must be written in a string which then will be evaluated by generator. Please see example below:
<pre>
{
  ...
  "myProperty": "(function(freq, data){ return 'MyValue_' + (Math.random() + data.i); })"
  ...
}
</pre>

#### URL prefix
With BVD 10.61, the receiver URL needs a prefix: <code>bvd-receiver</code>. This can be specified with the optional property <code>prefix</code>.

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
[HPE Marketplace](https://marketplace.saas.hpe.com/itom/category/opsb?product=Business%20Value%20Dashboard&version=All%20versions&company=All%20companies)


