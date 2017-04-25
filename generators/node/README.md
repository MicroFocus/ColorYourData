Data generator using Node.js
## Installing
Download the repository, cd into the node directory and run
<pre>
npm install
</pre>

## Running
### Basic data generator 
<pre>
node basicGenerator.js config_file.json
</pre>
Specify a config file with basic info like host, port, protocol and API key, 
plus add a list of generators with samples and update frequency.
See config.json for an example.
If you omit the port it will use the default according to the protocol.
If you omit the protocol, http is used.

Values can be generated in multiple ways:

As value range:
<pre>
"value": {"range": [0,100]}
</pre>
As value out of a list:
<pre>
"value": ["good", "bad", "medium"]
</pre>
As value range with auto increment by give value (incr) and number of steps (steps). After the number of steps the offset will be reset to 0. The growing offset will be added to the random value out of the range array:
<pre>
"value": {"range": [70,80], "incr": 5, "steps": 10}
</pre>

The incremental change of values normally starts with the start of the generator and loops over the steps. The start can be triggered by calling a trigger URL using curl or your browser. To do that specify an additional trigger property like so:
<pre>
"value": {"range": [70,80], "incr": 5, "steps": 10, "trigger": "foo"}
</pre>
With this setup a call of <code>http://localhost:55123/foo</code> will start the increment once for the given number of steps.

The format of a numerical output can be controlled by a format string via the <code>format</code> property. Formatting makes use of the numeral.js package. E.g. 0.00 formats a number to two decimal digits.

With BVD 10.61, the receiver URL needs a prefix: <code>bvd-receiver</code>. This can be specified with the optional property <code>prefix</code>.

In case you need to specify a proxy, please do so using environment variables like 
<pre>
HTTP_PROXY / http_proxy
HTTPS_PROXY / https_proxy
</pre>

### AO-Bank sample data generator 
<pre>
node ao_bank_gen.js host:port ApiKey 
</pre>
This generator drives the sample dashboards available from the 
[HPE Live Network](https://hpln.hpe.com/product/business-value-dashboard/content)


