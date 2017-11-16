/**
 * Use vega Lite charting with data from a channel
 */

/* global bvdPluginManager, jQuery, vega */

'use strict';

bvdPluginManager.registerWidget({
  id: 'opr_vega_channel',
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

  init: function(ctx) {
    let initialData;
    const tDelta = ctx.getProperty('time') * 1000;

    ctx.onInit({
      itemCount: Date.now() - tDelta - 10000,
      callback: function(envelopeArray) {
        if (envelopeArray && envelopeArray.length > 0) {
          console.log('load records: ' + envelopeArray.length);
          initialData = envelopeArray;
        }
      }
    });

    ctx.scope.jsLoadService.loadScript('https://cdnjs.cloudflare.com/ajax/libs/vega/3.0.2/vega.js').then(() => {
      ctx.scope.jsLoadService.loadScript('https://cdnjs.cloudflare.com/ajax/libs/vega-lite/2.0.0-rc3/vega-lite.js').then(() => {
        ctx.scope.jsLoadService.loadScript('https://cdnjs.cloudflare.com/ajax/libs/vega-embed/3.0.0-beta.20/vega-embed.js').then(() => {
          // hide the placeholder
          ctx.placeHolder.attr('style', 'visibility: hidden;');

          const
            svg = ctx.parentGroup,
            margin = { top: 5, left: 10, bottom: 25, right: 5 },
            width = ctx.bbox.width,
            height = ctx.bbox.height,
            g = svg.append('g')
              .attr('transform', 'translate(' + -25 + ',' + (ctx.bbox.y/* - margin.bottom*/) + ')');

          const spec = {
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
              .css('width', width - margin.right - margin.left)
              .css('height', height - margin.bottom)
              .appendTo(document.body);

          const opts = {
            mode: 'vega-lite',
            renderer: 'svg',
            width: width - (margin.left + margin.right),
            height: height - (margin.bottom + margin.top),
            padding: margin
          };
          vega.embed('#' + visId, spec, opts).then(function(result) {
            let removed = d3.select('#' + visId + ' svg').remove();
            g.append(() => {
              temp.remove();
              return removed.node();
            });
            // handle dynamic updates
            const addData = function(envelope) {
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

            const checker = () => {
              console.log('check records');
              if (initialData && initialData.length > 0) {
                console.log('found records: ' + initialData.length);
                const changeSet = vega.changeset();
                initialData.forEach(element => {
                  changeSet.insert(element.data);
                }, this);
                result.view.change('table', changeSet).run();
              } else {
                setTimeout(checker, 100);
              }
            };
            checker();
            /* subscribe to changes */
            ctx.onChange({
              callback: addData
            });
          });
        });
      })
    });
  }
});
