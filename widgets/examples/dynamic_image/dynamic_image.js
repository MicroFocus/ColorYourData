'use strict';

/**
 * This widget renders an image specified by an URL.
 * Position and size is controlled by the placeholder rect.
 * Using ${property} you can dynamically change the URL based on properties of received data.
 */

/* globals bvdPluginManager */

bvdPluginManager.registerWidget({
  id: 'dynamic_image',
  displayName: 'Dynamic Image',
  hasData: false,

  init: function(ctx) {

    const interpolate = function(str, data, pattern = /\$\{([^{}]*)\}/g) {
      if (!data) {
        return str.replace(pattern, '');
      }

      return str.replace(pattern, function(value, property) {
        var result = data[property];

        if (result === 0) { // escape null values
          result = String(result);
        }

        return result;
      });
    };

    // hide the placeholder rect
    ctx.placeHolder.attr('style', 'visibility: hidden;');

    // create an image tag with the size of the placeholder rect
    const image = ctx.svgGroup
      .append('image')
      .attr('x', ctx.bbox.x)
      .attr('y', ctx.bbox.y)
      .attr('width', ctx.bbox.width)
      .attr('height', ctx.bbox.height);

    const setImage = function(envelope) {
      if (!envelope || !envelope.data) {
        return;
      }

      // update the image URL. Interpolate potential variables in the URL string with the received data
      image.attr('xlink:href', interpolate(ctx.getProperty('bvd_image_url'), envelope.data));
    };

    /* get initial state of this widget*/
    ctx.onInit({
      itemCount: 1,
      callback: function(envelopeArray) {
        if (envelopeArray && envelopeArray.length > 0) {
          setImage(envelopeArray[0]);
        }
      }
    });

    /* subscribe to changes */
    ctx.onChange({
      callback: setImage
    });
  },

  customProperty: [{
    id: 'bvd_image_url',
    label: 'Image URL',
    type: 'text',
    default: ''
  }]
});
