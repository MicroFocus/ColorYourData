### Simple BVD adapter for OpenWeather Information
#### Intro
This is a simple BVD integration adapter for OpenWeatherMap, which can be used to monitor the weather information for several locations in real time and feed it into BVD.
It uses OpenWeatherMap API and sends the data in json format prepared to be feeded to a BVD dashboard.
#### How to use
###### Download the adapter
Clone out of GitHub or simple copy&paste the content of both python files on your system.
###### Preparations needed
This adapter was developed for Python 3.4, but would most probably work with all Python versions above as well.
You would need to have a Python interpreter installed.

In addition once you have started it, it will keep sending data to your BVD instance, thus you need to map this data to some of your dashboards.
###### Install
There is no need to install the adapter.
###### Configure
Edit `OpenWeather2BVDConfig.py` to adapt parameters as required for your local BVD setup and OpenWeatherMap API Activated App Account:

Which locations should be monitored:
```
locations = ['48.990875,8.487525 (locationA)','48.7102865,8.9715484 (locationB)']
```
How many days forecast (1 - 16)
```
forecastDays = 3
```
Time in seconds before next request is sent to OpenWeatherMap API:
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
#>python3 OpenWeather2BVD.py
```
This will keep pulling new weather information for your locations in nearly real time (depending on your setting for *sleep*) and send it to your BVD instance.
Now that you have data arrived at your BVD instance you can simply map it to your BVD dashboards.

Note: The *name* is used as BVD *dimension*

###### Demo
[OpenWeatherMap Example Dashboard in BVD](openWeatherBVD.png "open weather map")
