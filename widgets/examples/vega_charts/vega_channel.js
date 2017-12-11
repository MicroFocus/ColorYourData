/**
 * Use vega Lite charting with data from a channel
 */

/* global bvdPluginManager, jQuery, vega, d3 */

'use strict';

bvdPluginManager.registerWidget({
  id: 'vega_channel',
  displayName: 'Using Vega',
  hasDataChannel: true,
  hasData: false,

  customProperty: [{
    id: 'spec',
    label: 'Vega-lite Spec',
    type: 'text',
    default: '',
    mandatory: true
  }, {
    id: 'time',
    label: 'Timespan in seconds',
    type: 'number',
    default: '10',
    mandatory: true
  }],

  init: ctx => {
    const tDelta = ctx.getProperty('time') * 1000;

    ctx.scope.jsLoadService.loadScript('https://cdnjs.cloudflare.com/ajax/libs/vega/3.0.2/vega.js').then(() => {
      ctx.scope.jsLoadService.loadScript('https://cdnjs.cloudflare.com/ajax/libs/vega-lite/2.0.0-rc3/vega-lite.js').then(() => {
        ctx.scope.jsLoadService.loadScript('https://cdnjs.cloudflare.com/ajax/libs/vega-embed/3.0.0-beta.20/vega-embed.js').then(() => {
          // hide the placeholder
          ctx.placeHolder.attr('style', 'visibility: hidden;');

          const
            svg = ctx.parentGroup,
            width = ctx.bbox.width,
            height = ctx.bbox.height,
            g = svg.append('g')
              .attr('transform', 'translate(' + 0 + ',' + ctx.bbox.y + ')');

          const spec = {
            width: width,
            height: height,
            autosize: {
              type: 'fit',
              contains: 'padding',
              resize: true
            },
            data: {
              name: 'table'
            },
            config: {
              axis: {
                labelFontSize: 8,
                titleFontSize: 0,
                titlePadding: 0
              },
              circle: {
                strokeWidth: '1',
                fill: 'white',
                stroke: 'blue'
              },
              line: {
                strokeWidth: '1'
              },
              scale: {
                round: true
              }
            }
          };

          jQuery.extend(spec, JSON.parse(ctx.getProperty('spec')));

          const
            visId = 'vis' + Date.now(),
            temp = jQuery('<div id="' + visId + '"></div>')
              .css('width', width)
              .css('height', height)
              .appendTo(document.body);

          const opts = {
            mode: 'vega-lite',
            renderer: 'svg'
          };
          vega.embed('#' + visId, spec, opts).then(result => {
            const moved = d3.select('#' + visId + ' svg').remove();
            g.append(() => {
              temp.remove();
              return moved.node();
            });
            // handle dynamic updates
            const addData = envelope => {
              if (!envelope || !envelope.data) {
                return;
              }
              const changeSet = vega.changeset()
                .insert(envelope.data)
                .remove(item => {
                  return item.time < Date.now() - tDelta;
                });
              result.view.change('table', changeSet).run();
            };

            ctx.onInit({
              itemCount: Date.now() - tDelta - 10000,
              callback: envelopeArray => {
                if (envelopeArray && envelopeArray.length > 0) {
                  const changeSet = vega.changeset();
                  envelopeArray.forEach(element => {
                    changeSet.insert(element.data);
                  }, this);
                  result.view.change('table', changeSet).run();
                }
                /* subscribe to changes */
                ctx.onChange({
                  callback: addData
                });
              }
            });
          });
        });
      })
    });
  }
});
