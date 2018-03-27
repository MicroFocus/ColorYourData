# Custom Widgets

## Getting Started
BVD dashboards can be extended with custom widgets. You write Visio shapes for the dashboard designer and JavaScript code to render widgets inside dashboards using the custom widget API.

The [docs](https://docs.microfocus.com/BVD/10.63/Content/knowledge_base/widgets/stencil_ref_custom.htm) provide further details including a full API spec.

Pick on of the examples as a starting point for your own first custom widget

## Working with JavaScript libraries
It is possible to include charting libraries inside custom widgets. Vega_channel.js is an example. Some charting libs however require a div element as anchor, which is difficult to include inside the SVG structure.
There are two options available:
  * foreignObject
  * remapping SVG graphics

ForeignObject embeds another namespace into the DOM but has know issues with browser compatibility.

Remapping SVG graphics is the idea to render the chart in a div element outside the dashboard SVG structure and after that move the SVG child of the div into the structure of the custom widget. Finally the div element is removed from the DOM. Again vega_channel.js is an example.
