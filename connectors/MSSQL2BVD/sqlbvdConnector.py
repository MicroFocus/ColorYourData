import urllib
from urllib.request import urlopen, Request
import pymssql
import json
from sqlConnectorConfig import bvdUrl, bvdApiKey, sleep, hst, srvr, prt, usr, pwd, db
import time

#SQL to Business value dashboard connector, Created by Mohamed Raoof
import http.client
http.client.HTTPConnection.debuglevel = 1


#request to BVD function
def postRequest(url, headers=None, data=None):
    request = Request(url)
    for header in headers:
        request.add_header(header['key'], header['value'])
    if data is not None:
        request.data = data
    response = urlopen(request)
    return response.read().decode('utf-8')

while(1):

    #connection request
    conn = pymssql.connect(
        host=hst,
        server=srvr,
        port=prt,
        user=usr,
        password=pwd,
        database=db)
    cursor = conn.cursor()

    # you must call commit() to persist your data if you don't set autocommit to True
    conn.commit()

    # Execute queries
    cursor.execute('select count(ID) from ALL_EVENTS where severity = %s', 'CRITICAL')

    #object
    list_obj = {}

    for row in cursor:
        list_obj['querytype']='eventcount1'
        list_obj['count'] = row[0]
        list_obj['timenow'] = time.ctime(int(time.time()))

    #convert to json
    json_data = json.dumps(list_obj)

    #Post request to BVD instance, change dims accordingly, for e.g /dims/querytype
    raw_data = postRequest(bvdUrl + '/api/submit/' + bvdApiKey + '/dims/querytype', [{'key':'Content-Type', 'value':'application/json'}], json.dumps(jsonDataForBVD).encode('ascii'))
    print (list_obj)
    time.sleep(sleep)
    conn.close()
