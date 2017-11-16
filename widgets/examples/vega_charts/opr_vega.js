/**
 * Using Vega Lite with SQL query data
 */

'use strict';

bvdPluginManager.registerWidget({
  id: 'opr_vega',
  displayName: 'Using Vega',
  hasDataChannel: false,

  customProperty: [{
    id: 'query',
    label: 'Query',
    type: 'text',
    default: ''
  }, {
    id: 'spec',
    label: 'Vega-lite Spec',
    type: 'text',
    default: '',
    mandatory: true
  }],

  init: function(ctx) {
    ctx.scope.jsLoadService.loadScript('https://cdnjs.cloudflare.com/ajax/libs/vega/3.0.2/vega.js').then(() => {
      ctx.scope.jsLoadService.loadScript('https://cdnjs.cloudflare.com/ajax/libs/vega-lite/2.0.0-rc3/vega-lite.js').then(() => {
        ctx.scope.jsLoadService.loadScript('https://cdnjs.cloudflare.com/ajax/libs/vega-embed/3.0.0-beta.20/vega-embed.js').then(() => {

          // hide the placeholder
          ctx.placeHolder.attr('style', 'visibility: hidden;');

          let
            svg = ctx.parentGroup,
            query = ctx.getProperty('query'),
            margin = { top: 0, left: 10, bottom: 8, right: 5 },
            width = ctx.bbox.width,
            height = ctx.bbox.height,
            g = svg.append('g')
              .attr('transform', 'translate(' + -25 + ',' + (ctx.bbox.y - margin.bottom) + ')');

          const spec = {

            data: {
              values: []
            },

            config: {
              axis: {
                labelFontSize: 6,
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
              }
            }
          };

          jQuery.extend(spec, JSON.parse(ctx.getProperty('spec')));

          d3.json('http://localhost:3000/query/' + query, (error, remoteData) => {
            if (error) {
              throw error;
            };

            spec.data.values = remoteData;

            let
              temp = jQuery('<div id="vis"></div>')
                .css('width', width)
                .css('height', height)
                .appendTo(document.body),
              opts = {
                mode: 'vega-lite',
                renderer: 'svg',
                width: width - (margin.left + margin.right),
                height: height - (margin.bottom + margin.top)
              };
            vega.embed('#vis', spec, opts).then(function(result) {
              var removed = d3.select('#vis svg').remove();
              g.append(function() {
                temp.remove();

                return removed.node();
              });
            });
          });
        });
      });
    });
  }
});
