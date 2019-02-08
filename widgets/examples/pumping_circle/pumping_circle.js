'use strict';

/**
 * The pumping circle widget
 * This widget shows a circle, that changes its radius,
 * based on the data coming through the channel
 */

/* globals bvdPluginManager */

bvdPluginManager.registerWidget({
  id: 'pumping_circle',
  displayName: 'The Pumping Circle',

  init: function(ctx) {
    const circleGroup = ctx.svgGroup,
      range = ctx.getProperty('bvd_range') || 100;

    console.log('range = ' + range);

    /* hide the placeholder */
    ctx.placeHolder.attr('style', 'visibility: hidden;');

    const circle = circleGroup
      .attr('transform', 'translate(' + ((ctx.bbox.x + ctx.bbox.width / 2)) + ',' + (ctx.bbox.y + ctx.bbox.height / 2) + ')')
      .append('circle')
      .attr('r', ctx.bbox.width / 4)
      .attr('cx', 0)
      .attr('cy', 0);

    const pumpCircle = function(envelope) {
      if (!envelope || !envelope.data) {
        return;
      }

      const currentColor = circle.attr('fill'),
        msg = envelope.data,
        radius = msg[ctx.dataField] / range * ctx.bbox.width / 2;

      circle.transition()
        .duration(300)
        .attr('r', radius)
        .attr('fill', ctx.getStatusColor() || currentColor);
    };

    /* get initial state of this widget*/
    ctx.onInit({
      itemCount: 1,
      callback: function(envelopeArray) {
        if (envelopeArray && envelopeArray.length > 0) {
          pumpCircle(envelopeArray[0]);
        }
      }
    });

    /* subscribe to changes */
    ctx.onChange({
      callback: pumpCircle
    });
  },

  customProperty: [{
    id: 'bvd_range',
    label: 'Range',
    type: 'number',
    default: 100
  }, {
    id: 'opr_coloring_rule',
    label: 'Coloring Rule',
    type: 'text'
  }]
});
