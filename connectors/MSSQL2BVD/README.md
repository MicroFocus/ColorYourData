### Simple BVD adapter for Microsoft SQL Database
#### Intro
This is a simple BVD integration adapter for MSSQL, which can be used to fetch information from your SQL Database in real time and feed it into BVD.
It uses Pymssql module in python and sends the data in json format prepared to be feeded to a BVD dashboard.
#### How to use
###### Download the adapter
Clone out of GitHub or simple copy&paste the content of both python files on your system.
###### Preparations needed
This adapter was developed for Python 3.5, but would most probably work with all Python versions above as well.
You would need to have a Python interpreter and pymssql module installed.

In addition once you have started it, it will keep sending data to your BVD instance, thus you need to map this data to some of your dashboards.
###### Install
There is no need to install the adapter.
###### Configure
Edit `sqlbvdConnector.py` to adapt parameters as required for your local BVD setup and the credentials or connection details of the SQL Database:

Which database need to connected:
```
server = "10.23.67.30:1456"; # Add Server Hostname with IP to access the DB, Eg: 10.23.67.30:1456
user = "UserName" # Add Username Here Eg: sqladmin
password = "Password" # Password
```
Query which need to be executed
```
cursor.execute('select count(ID) from ALL_EVENTS where severity = %s', 'CRITICAL')
```
Time in seconds before next query execution:
```
sleep = 35
```
API key from your OpenWeatherMap API Activated App Account:
```
apiKey = 'foo'
```
Url and apiKey of your BVD instance:
```
bvdUrl = 'https://foo'
bvdApiKey = 'bar'
```

###### Run
```
#>python3 sqlbvdConnector.py
```
This will keep pulling the query result from your sql database in nearly real time (depending on your setting for *sleep*) and send it to your BVD instance.
Now that you have data arrived at your BVD instance you can simply map it to your BVD dashboards.

Note: The *name* is used as BVD *dimension*

