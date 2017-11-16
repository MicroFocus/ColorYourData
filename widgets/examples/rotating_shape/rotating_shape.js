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
      //range = ctx.getProperty('bvd_range') || 100,
      cx = Number(ctx.getProperty('bvd_rotation_center_x')) * 25.4,
      cy = Number(ctx.getProperty('bvd_rotation_center_y')) * 25.4,
      t1 = 'translate(' + (ctx.bbox.x + cx) + ' ' + (ctx.bbox.y + cy) + ')',
      t2 = 'translate(' + (-(ctx.bbox.x + cx)) + ' ' + (-(ctx.bbox.y + cy)) + ')';


    console.log(cx);
    console.log(cy);
    console.log(ctx.bbox);

    var prevR = 0;
    var lastR = 0;

    function rotateShape(envelope) {
      if (!envelope || !envelope.data) {
        return;
      }

      const
        msg = envelope.data,
        r = msg[ctx.dataField] * 3.6;

      prevR = lastR;
      ctx.placeHolder.transition()
        .duration(0)
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
