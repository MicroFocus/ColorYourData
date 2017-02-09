from urllib.request import urlopen, Request
import json
import time
import datetime
from GmapsDistance2BVDConfig import routes, sleep, apiKey, bvdUrl, bvdApiKey

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
    origins = ''
    destinations = ''
    for k, v in routes.items():
        origins += k + '|'
        destinations += v + '|'
    apiUrl = 'https://maps.googleapis.com/maps/api/distancematrix/json?departure_time=now&key=' + apiKey + '&origins=' + origins + '&destinations=' + destinations
    raw_data = postRequest(apiUrl)
    parsedJson = json.loads(raw_data)
    if 'status' in parsedJson and parsedJson['status'].upper() == 'OK':
        for idx, key in enumerate(routes):
            resolvedOrigin = parsedJson['origin_addresses'][idx]
            resolvedDestination = parsedJson['destination_addresses'][idx]
            trafficDetails = parsedJson['rows'][idx]['elements'][idx]
            distance = trafficDetails['distance']['text']
            duration = trafficDetails['duration']['text']
            trafficDuration = trafficDetails['duration_in_traffic']['text']
            #linkToTrafficDetails = 'https://www.google.de/maps/dir/' + origin + '/' + destinations[idx]
            linkToTrafficDetails = key + '/' + routes[key]
            preparedTrafficDetails = {'routeNum':'route' + str(idx), 'origin':resolvedOrigin, 'destination':resolvedDestination, 'distance':distance, 'duration':duration, 'trafficDuration':trafficDuration, 'link':linkToTrafficDetails, 'timestamp':datetime.datetime.now().strftime("%Y-%m-%d %H:%M:%S")}
            jsonDataForBVD.append(preparedTrafficDetails)
        print (json.dumps(jsonDataForBVD).encode('ascii'))
        raw_data = postRequest(bvdUrl + '/api/submit/' + bvdApiKey + '/dims/routeNum', [{'key':'Content-Type', 'value':'application/json'}], json.dumps(jsonDataForBVD).encode('ascii'))
        print ('trafficDetails sent? ' + raw_data)
    time.sleep(sleep)