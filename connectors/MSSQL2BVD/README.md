### Simple BVD adapter for Microsoft SQL Database
#### Intro
This is a simple BVD integration adapter for MSSQL, which can be used to fetch information from your Microsoft SQL Database in real time and feed it into BVD.
This adapter uses the Pymssql module in Python and sends the data in json format prepared to be fed to a BVD dashboard.
#### How to use
###### Download the adapter
Clone out of GitHub or simply copy&paste the content of both python files on your system.
###### Preparations needed
This adapter was developed for Python 3.5, but will probably work with all Python versions above as well. You need to have a Python interpreter and the pymssql module installed.

In addition, once started, it will keep sending data to your BVD instance. You need to map this data to some of your dashboards.
###### Install
There is no need to install the adapter.
###### Configure
Edit `sqlbvdConnector.py` to modify the parameters as required for your local BVD setup and the credentials or connection details of the Microsoft SQL Database:

Database connection information:
```
server = "10.23.67.30:1456"; # Add Server with IP to access the DB, Eg: 10.23.67.30:1456
user = "UserName" # Add Username Here Eg: sqladmin
password = "Password" # Password
```
Define the Query that needs to be executed for the appropriate data pull:
```
cursor.execute('select count(ID) from ALL_EVENTS where severity = %s', 'CRITICAL')
```
Time in seconds before next query execution:
```
sleep = 35
```
URL and apiKey of your BVD instance:
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

