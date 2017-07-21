from urllib.request import urlopen, Request
from urllib.parse import quote_plus
from base64 import b64encode
import json
import time
from OpenWeather2BVDConfig import locations, forecastDays, sleep, apiKey, bvdUrl, bvdApiKey

# comment out below two lines for verbose http
#import http.client
#http.client.HTTPConnection.debuglevel = 1

def postRequest(url, headers=None, data=None):
    request = Request(url)
    if headers is not None:
        for header in headers:
            request.add_header(header['key'], header['value'])
    if data is not None:
        request.data = data
    response = urlopen(request)
    return response.read().decode('utf-8')

# get traffic details
while(1):
    jsonDataForBVD = []
    for location in locations:
        latLon = location.split(',')
        if len(latLon) == 2:
            lat = latLon[0]
            lon = latLon[1]
        else:
            lat = '0'
            lon = '0'
        raw_data = postRequest('http://api.openweathermap.org/data/2.5/weather?units=metric&APPID=' + apiKey + '&lat=' + lat + '&lon=' + lon)
        parsedJsonWeather = json.loads(raw_data)
        name = parsedJsonWeather.get('name') + ', ' + parsedJsonWeather.get('sys').get('country')
        weather = parsedJsonWeather.get('weather')[0].get('main') + ', ' + parsedJsonWeather.get('weather')[0].get('description')
        temp = parsedJsonWeather.get('main').get('temp')
        humidity = parsedJsonWeather.get('main').get('humidity')
        pressure = parsedJsonWeather.get('main').get('pressure')
        wind = parsedJsonWeather.get('wind')
        clouds = parsedJsonWeather.get('clouds')
        rain = parsedJsonWeather.get('rain')
        snow = parsedJsonWeather.get('snow')
        sunRise = time.ctime(parsedJsonWeather.get('sys').get('sunrise'))
        sunSet = time.ctime(parsedJsonWeather.get('sys').get('sunset'))
        linkToOpenWeather = 'http://openweathermap.org/city/' + str(parsedJsonWeather.get('id'))
        preparedOpenWeather = {'name':name, 'weather':weather, 'temp':temp, 'humidity':humidity, 'pressure':pressure, 'sunRise':sunRise, 'sunSet':sunSet, 'link':linkToOpenWeather}
        if wind is not None:
            wind = parsedJsonWeather.get('wind').get('speed')
            preparedOpenWeather['wind'] = wind
        else:
            preparedOpenWeather['wind'] = '0'
        if clouds is not None:
            clouds = parsedJsonWeather.get('clouds').get('all')
            preparedOpenWeather['clouds'] = clouds
        else:
            preparedOpenWeather['clouds'] = '0'
        if rain is not None:
            rain = parsedJsonWeather.get('rain').get('3h')
            preparedOpenWeather['rain'] = rain
        else:
            preparedOpenWeather['rain'] = '0'
        if snow is not None:
            snow = parsedJsonWeather.get('snow').get('3h')
            preparedOpenWeather['snow'] = snow
        else:
            preparedOpenWeather['snow'] = '0'
        raw_data = postRequest('http://api.openweathermap.org/data/2.5/forecast/daily?units=metric&APPID=' + apiKey + '&lat=' + lat + '&lon=' + lon + '&cnt=' + str(forecastDays))
        for idx, dayForecast in enumerate(json.loads(raw_data)['list'], start=1):
            weatherForecast = dayForecast.get('weather')[0].get('main') + ', ' + dayForecast.get('weather')[0].get('description')
            #tempForecast = str(dayForecast['temp']['night']) + '/' + str(dayForecast['temp']['morn']) + '/' + str(dayForecast['temp']['day']) + '/' + str(dayForecast['temp']['eve']) + '(' + str(dayForecast['temp']['min']) + '/' + str(dayForecast['temp']['max']) + ')'
            tempForecast = str(dayForecast['temp']['min']) + ' - ' + str(dayForecast['temp']['max'])
            humidityForecast = dayForecast.get('humidity')
            pressureForecast = dayForecast.get('pressure')
            windForecast = dayForecast.get('speed')
            cloudsForecast = dayForecast.get('clouds')
            rainForecast = dayForecast.get('rain')
            snowForecast = dayForecast.get('snow')
            preparedOpenWeather.update({'weatherForecast' + str(idx):weatherForecast, 'tempForecast' + str(idx):tempForecast, 'humidityForecast' + str(idx):humidityForecast, 'pressureForecast' + str(idx):pressureForecast})
            if windForecast is not None:
                preparedOpenWeather['windForecast' + str(idx)] = windForecast
            else:
                preparedOpenWeather['windForecast' + str(idx)] = '0'
            if cloudsForecast is not None:
                preparedOpenWeather['cloudsForecast' + str(idx)] = cloudsForecast
            else:
                preparedOpenWeather['cloudsForecast' + str(idx)] = '0'
            if rainForecast is not None:
                preparedOpenWeather['rainForecast' + str(idx)] = rainForecast
            else:
                preparedOpenWeather['rainForecast' + str(idx)] = '0'
            if snowForecast is not None:
                preparedOpenWeather['snowForecast' + str(idx)] = snowForecast
            else:
                preparedOpenWeather['snowForecast' + str(idx)] = '0'
        jsonDataForBVD.append(preparedOpenWeather)
    print (json.dumps(jsonDataForBVD))
    raw_data = postRequest(bvdUrl + '/api/submit/' + bvdApiKey + '/dims/name', [{'key':'Content-Type', 'value':'application/json'}], json.dumps(jsonDataForBVD).encode('ascii'))
    print ('openWeather data sent? ' + raw_data)
    time.sleep(sleep)

