Data generator using Node.js
## Installing
Download the repository, cd into the node directory and run
<pre><code>
npm install
</code></pre>

## Running
### Basic data generator 
<pre><code>
node basicGenerator.js config_file.json
</code></pre>
Specify a config file with basic info like host port and API key, 
plus add a list of generators with samples and update frequency.
See config.json for an example.

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


