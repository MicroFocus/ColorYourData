#Tips & Tricks when using BVD

This document complements the tips and tricks section in the online help for BVD.
It will have a higher change rate. So you might want to check back frequently.

##Tip: Designing for a specific device aspect ratio
One of the most important aspect of a BVD dashboard is the optimal alignment with the aspect ratio of your target device.
E.g. you don't want to create a nearly squared dashboard to be shown on a 16:9 screen.
For that purpose we created a set of frames as shapes in the BVD stencil. These frames maintain a preset ratio (e.g. 4:3, 16:9).
Scale the frame according to the rest of your drawing and place all your elements into that frame.
After that arrangement you can remove the frame.

Finally (important!) go to the 'Design' ribbon and select the 'Size' icon.
Go down and click 'Fit to drawing'. Now Visio has adjusted the document size to wrap all your alements,
which are arranged in a 16:9 (or 4:3) frame.

Now save, export and upload and your dashboard should fill in all space of the target device.

##Tip: Controlling global CSS settings for dashboard views
Using the System Settings page behind the wrench icon you can specify CSS properties that apply to all loaded dashboard views including
the masthead. For example you can apply CSS properties for feed items embedded in the feed widget.

For example the following can be used to control the feed items

    .feedItem .ts {display: none;} 
    .feedItem .even {background-color: #262627;} 
    .feedItem a:hover {text-decoration: none;} 
    .feedItem section {hight:30px; padding: 3px; margin: 0}

To learn the DOM structure of the feed items, have a look at your browsers inspect functionality.

##Tip: Controlling CSS properties of individual dashboards
If you need to have different CSS settings for your dashboards the above method does not work. 
However you can further constrain the selection of dashboards with CSS attribute selection.

The example below applies feed-item CSS only to a dashboard with the name 'MyDashboard':

    svg-img[dashboard-id="MyDashboard"] .feedItem a {
      color: white;
      font-size: 1.5vh;
      font-family: Myriad Pro Light;
      display: inline;
    } 

There are more variants of the attribute selector, for example to select with a name pattern rather than
the full name.

##Tip: Feed Widget with adaptive text size
The BVD feed widget is a nice way of describing lists with HTML and CSS.
However they do not scale with the rest of the dashboard. That means all SVG based drawings scale with the size of the screen,
but HTML text in feeds stay fixed according their CSS specs.

Since you are in control of the CSS specs for the feed items, you can make use of the relative size units for CSS.
They are 'vh' and 'vt', like in here:

    .element-one {
      font-size: 10vh;
    }

    .element-two {
      font-size: 10vw;
    }

Where 
  * 1vw = 1% of viewport width
  * 1vh = 1% of viewport height 

The scale effect will not be identical to the surrounding SVG, 
but it helps to compensate the difference between SVG and HTML.

##Tip: Specifying fonts that work on all devices
For BVD to be able to render the text as designed in Visio, 
you must make the fonts used in Visio available to the web browser where you view the dashboards. 
If the web browser does not have access to the fonts, the system default fonts are used.

For example, if you use the Windows font Calibri in Visio, 
and then view your dashboard in a browser on a Linux system or on an iPad,
the browser will substitute Calibri with a system font because Calibri is not installed, neither on Linux nor on iOS.

To enable platform-independent text rendering, 
use Google Fonts when designing your dashboard drawings in Visio. 
BVD then directs the browser to load the fonts from http://www.google.com/fonts when displaying a BVD dashboard.

To use a Google font in Visio you have to download and install the corresponding TTF file before starting Visio.

##Tip: Show, hide or dim parts of your dashboard
If you want to hide areas of your dashboard or dim their color saturation as a consequence
of a data change, then use the Status Visiblity Group widget. But instead of grouping the widgets you want to hide,
the trick is to create a white shape that overlays that part of your dashboard you wnat to hide or dim.
Next is to control the visibility of that new shape with Visiblity Group widget.

In order to dim the area, you simply asign a transparancy effect to the covering shape.
In my example the shape was white assumed that the background of your dashboard is also white.


