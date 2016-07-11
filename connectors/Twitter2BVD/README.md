###Simple BVD adapter for Twitter hashtag searches
####Intro
This is a simple BVD integration adapter for Twitter, which can be used to feed tweets into BVD, containing certain #hashtags in real time.
It uses Twitter's Search API 1.1 and sends the data in json format prepared to be feeded directly to a *news feed* widget in your BVD dashboard of a choice.
####How to use
######Download the adapter
Clone out of GitHub or simple copy&paste the content of both python files on your system.
######Preparations needed
This adapter was developed for Python 3.4, but would most probably work with all Python versions above as well.
You would need to have a Python interpreter installed.

In addition once you have started it, it will keep sending data to your BVD instance, thus you need to map this data to some of your dashboards containing *news feed* widgets.
######Install
There is no need to install the adapter.
######Configure
Edit `Twitter2BVDConfig.py` to adapt parameters as required for your local BVD setup and Twitter API account:

Which hashtags should be searched for:
```
hashtags = ['#foo', '#bar', '#some']
```
Time in seconds before next search request is sent to Twitter:
```
sleep = 5
```
API key and secret from your Twitter API account for application-only authentication (https://dev.twitter.com/oauth/application-only):
```
apiKey = 'foo'
apiSecret = 'bar'
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
This will keep pulling new tweets for your hashtags from Twitter in nearly real time (depending on your setting for *sleep*) and send them to your BVD instance.
Now that you have data arrived at your BVD instance you can simply map it to your *news feed* widgets of your dashboards.

Note: The hashtag name is used as BVD *dimension*

######Demo
[Tweets in BVD](tweets4BVD.png "Tweets in BVD")
