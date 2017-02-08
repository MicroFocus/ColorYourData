###Simple BVD adapter for Google Maps Traffic
####Intro
This is a simple BVD integration adapter for Google Maps, which can be used to monitor the traffic for several routes in real time and feed it into BVD.
It uses Google Maps Distance Matrix API and sends the data in json format prepared to be feeded to a BVD dashboard.
####How to use
######Download the adapter
Clone out of GitHub or simple copy&paste the content of both python files on your system.
######Preparations needed
This adapter was developed for Python 3.4, but would most probably work with all Python versions above as well.
You would need to have a Python interpreter installed.

In addition once you have started it, it will keep sending data to your BVD instance, thus you need to map this data to some of your dashboards.
######Install
There is no need to install the adapter.
######Configure
Edit `GmapsDistance2BVDConfig.py` to adapt parameters as required for your local BVD setup and Google Maps Distance Matrix API Activated App Account:

Which routes should be monitored:
```
routes = {'lat,long (originA)':'lat,long (destinationB)', 'lat,long (originC)':'lat,long (destinationD)'}
```
Time in seconds before next request is sent to Google Maps Distance Matrix API:
```
sleep = 35
```
API key from your Google Maps Distance Matrix API Activated App Account:
```
apiKey = 'foo'
```
Url and apiKey of your BVD instance:
```
bvdUrl = 'https://foo'
bvdApiKey = 'bar'
```

######Run
```
#>python3 Twitter2BVD.py
```
This will keep pulling new traffic information for your routes in nearly real time (depending on your setting for *sleep*) and send them to your BVD instance.
Now that you have data arrived at your BVD instance you can simply map it to your BVD dashboards.

Note: The *routeNum* is used as BVD *dimension*

######Demo
[Traffic info for a round trip in BVD](gmapsBvd1.png "round trip traffic info1")\\
[BVD link refers to Gmaps origin A -> destination B](gmapsBvd2.png "round trip traffic info2")\\
[BVD link refers to Gmaps for the way back origin B -> destination A](gmapsBvd3.png "round trip traffic info3")
