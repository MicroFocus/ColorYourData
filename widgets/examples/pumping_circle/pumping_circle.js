/**
 * The pumping circle widget
 * This widget shows a circle, that changes its radius,
 * based on the data coming through the channel
 */

bvdPluginManager.registerWidget({
  id: 'pumping_circle',
  displayName: 'The Pumping Circle',

  init: function(ctx) {

    var
      circle_group = ctx.svgGroup,
      range = ctx.getProperty('bvd_range') || 100;


    console.log('range = ' + range);
    // hide the placeholder
    ctx.placeHolder.attr('style', 'visibility: hidden;');

    var circle = circle_group
      .attr('transform', 'translate(' + ((ctx.bbox.x + ctx.bbox.width / 2)) + ',' + (ctx.bbox.y + ctx.bbox.height / 2) + ')')
      .append("circle")
      .attr("r", ctx.bbox.width / 4)
      .attr("cx", 0)
      .attr("cy", 0);

    function pumpCircle(envelope) {
      if (!envelope || !envelope.data) {
        return;
      }
      var
        msg = envelope.data,
        r = msg[ctx.dataField] / range * ctx.bbox.width / 2;

      circle.transition()
        .duration(300)
        .attr("r", r);
    }

    // get initial state
    ctx.onInit({
      itemCount: 1,
      callback: function(envelopeArray) {
        if (envelopeArray && envelopeArray.length > 0) {
          pumpCircle(envelopeArray[0]);
        }
      }
    });

    // subscribe to changes
    ctx.onChange({ callback: pumpCircle });
  },

  defaults: { bvd_range: 100 }
});
