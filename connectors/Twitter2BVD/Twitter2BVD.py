from urllib.request import urlopen, Request
from urllib.parse import quote_plus
from base64 import b64encode
import json
import time
from TwitterAdapterForBVDConfig import hashtags, sleep, apiKey, apiSecret, bvdUrl, bvdApiKey

# comment out below two lines for verbose http
#import http.client
#http.client.HTTPConnection.debuglevel = 1

def postRequest(url, headers, data=None):
    request = Request(url)
    for header in headers:
        request.add_header(header['key'], header['value'])
    if data is not None:
        request.data = data
    response = urlopen(request)
    return response.read().decode('utf-8')

credentials = quote_plus(apiKey) + ':' + quote_plus(apiSecret)
base64credentials = b64encode(credentials.encode('ascii')).decode('utf-8')
raw_data = postRequest('https://api.twitter.com/oauth2/token', [{'key':'Content-Type', 'value':'application/x-www-form-urlencoded;charset=UTF-8'}, {'key':'Authorization', 'value':'Basic ' + base64credentials}], 'grant_type=client_credentials'.encode('ascii'))
bearer = json.loads(raw_data)['access_token']

# get tweets
# initialize sinceIds according to number of hashtags
sinceIds = []
for val in hashtags:
    sinceIds.append(0)
while(1):
    jsonDataForBVD = []
    for idx, hashtag in enumerate(hashtags):
        raw_data = postRequest('https://api.twitter.com/1.1/search/tweets.json?include_entities=true&result_type=recent&count=15&q=' + quote_plus(hashtag) + '&since_id=' + str(sinceIds[idx]), [{'key':'Authorization', 'value':'Bearer ' + bearer}])
        tweets = json.loads(raw_data)['statuses']
        for tweet in tweets:
            currentSinceId = tweet['id']
            if sinceIds[idx] < currentSinceId:
                sinceIds[idx] = currentSinceId
            createdInMillis = int(time.mktime(time.strptime(tweet['created_at'],'%a %b %d %H:%M:%S +0000 %Y')) * 1000)
            linkToTweet = 'https://twitter.com/statuses/' + tweet['id_str']
            #print (str(currentSinceId) + ' ' + tweet['created_at'] + ' ' + str(createdInMillis) + ' ' + tweet['text'] + ' ' + linkToTweet)
            preparedTweet = {'time':createdInMillis, 'title':tweet['text'], 'link':linkToTweet, 'hashtag':hashtag}
            jsonDataForBVD.append(preparedTweet)
        #print ('#' + hashtag + ' ' + str(sinceIds[idx]))
    print (json.dumps(jsonDataForBVD))
    print (sinceIds)
    raw_data = postRequest(bvdUrl + '/api/submit/' + bvdApiKey + '/dims/hashtag', [{'key':'Content-Type', 'value':'application/json'}], json.dumps(jsonDataForBVD).encode('ascii'))
    print ('tweets sent? ' + raw_data)
    time.sleep(sleep)


