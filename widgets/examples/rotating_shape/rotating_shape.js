/**
 * The rotating shape widget
 * This widget rotates a shape at the center using an angle value,
 * based on the data coming through the channel
 */

/* global bvdPluginManager */

'use strict';

bvdPluginManager.registerWidget({
  id: 'rotating_shape',
  displayName: 'The Rotating Shape',

  init: function(ctx) {

    const
      range = ctx.getProperty('bvd_range') || 100,
      t1 = 'translate(' + (ctx.bbox.x + ctx.bbox.width / 2) + ' ' + (ctx.bbox.y + ctx.bbox.height / 2) + ')',
      t2 = 'translate(' + (-(ctx.bbox.x + ctx.bbox.width / 2)) + ' ' + (-(ctx.bbox.y + ctx.bbox.height / 2)) + ')';


    var prevR = 0;
    var lastR = 0;

    function rotateShape(envelope) {
      if (!envelope || !envelope.data) {
        return;
      }

      const
        msg = envelope.data,
        r = msg[ctx.dataField];

      prevR = lastR;
      ctx.placeHolder.transition()
        .duration(300)
        .attrTween("transform", tween);

      function tween(d, i, a) {
        return function(t) {
          lastR = d3.interpolateNumber(prevR, r)(t);
          return t1 + ' ' + 'rotate(' + lastR % 360 + ')' + ' ' + t2;
        }
      }
    }

    // get initial state
    ctx.onInit({
      itemCount: 1,
      callback: function(envelopeArray) {
        if (envelopeArray && envelopeArray.length > 0) {
          rotateShape(envelopeArray[0]);
        }
      }
    });

    // subscribe to changes
    ctx.onChange({ callback: rotateShape });
  }
});
