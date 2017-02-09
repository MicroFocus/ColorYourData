# define your origins and destinations with latitude/longitude coordinates (take these value from a regular google map from your browser)
# each key-value pair from the routes map represents origin (key) and destination (value) for a particular route
# E.g. routes = {'cityA':'cityB', 'cityB':'cityA'} would get the traffic details for cityA -> cityB and the way back cityB -> cityA
# Note that google map distance matrix api limits the url length to 2000 chars, so limit your routes accordingly
routes = {'48.990875,8.487525':'48.7102865,8.9715484', '48.7102865,8.9715484':'48.990875,8.487525'}
# change how often traffic updates are pulled (in secs). Currently Google Maps API allows around 2500 free requests per day
sleep = 35
# key for your Google Maps Distance Matrix API activated app
apiKey = 'foo'
# Url to BVD receiver and corresponding BVD api key
bvdUrl = 'https://foo'
bvdApiKey = 'bar'