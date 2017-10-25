# Custom Widgets

BVD provides an API to implement additional widgets. This allows you to visualize data in ways other than what is possible with the widgets shipped with BVD.

To create your own widget, you require the following:
1. A Visio shape which acts as a placeholder for the widgets in the dashboard.

    See the [Custom Widget Visio Documentation](./README_CUSTOM_WIDGET_VISIO.MD).
2. A JavaScript file to code the widget using DOM and SVG manipulation with svgImageService and bvdPluginManager.

    See the [Custom Widget API Documentation](./README_CUSTOM_WIDGET_API.MD).

The full code example of the custom widget used in this documentation can be found here:
- Visio shape: [pumping_circle.vsdx](./pumping_circle.vsdx)
- Javascript file: [pumping_circle.js](./pumping_circle.js)
