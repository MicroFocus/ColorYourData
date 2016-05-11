Data generator using Node.js
## Installing
Download the repository, cd into the node directory and run
<pre><code>
npm install
</code></pre>

## Running
### Basic data generator 
<pre><code>
node basicGenerator.js host:port ApiKey 
</code></pre>
where host:port and ApiKey is related to the BVD instance/tenant 
you're sending the data to.

### AO-Bank sample data generator 
<pre><code>
node ao_bank_gen.js host:port ApiKey 
</code></pre>
This generator drives the sample dashboards available from the 
[HPE Live Network](https://hpln.hpe.com/product/business-value-dashboard/content)


