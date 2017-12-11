# Dynamic Image custom widget

Load an image with an URL that can be changed with incoming message properties.
Assume you send weather-info message like this:
```javascript
{
  temperatur: 23,
  wind: 5,
  icon: "cloudy"
}
```

Now with this custom widget you can specify an URL to load the weather icon dynamically based on the icon property.
The URL might then look like this:

```
https://myhost.com/static/icons/${icon}.png
```

The attached shape will act as the placeholder for the loaded image. With and height will be applied and might stretch the image.
