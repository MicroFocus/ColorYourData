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


When spcifying the value of sample properties, an array describes a set of possible values, where the generator picks one.
You can also specify numeric ranges with a range property. The array describes the start and end of the range.

In case you need to specify a proxy, please do so using environment variables like 
<pre><code>
HTTP_PROXY / http_proxy
HTTPS_PROXY / https_proxy
</code></pre>

### AO-Bank sample data generator 
<pre><code>
node ao_bank_gen.js host:port ApiKey 
</code></pre>
This generator drives the sample dashboards available from the 
[HPE Live Network](https://hpln.hpe.com/product/business-value-dashboard/content)


