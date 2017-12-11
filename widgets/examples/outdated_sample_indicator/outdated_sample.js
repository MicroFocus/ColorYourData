/**
 *
 */

/* global bvdPluginManager */

'use strict';

bvdPluginManager.registerWidget({
  id: 'outdated_sample',
  displayName: 'Detect stale channel data',

  init: function(ctx) {

    var toId;

    const to = ctx.getProperty('timeout') * 1000;

    const hideShape = () => {
      ctx.placeHolder.attr('style', 'visibility: hidden;');
    }

    const showShape = () => {
      ctx.placeHolder.attr('style', 'visibility: visible;');
    }

    const startTimer = () => {
      toId = setTimeout(() => {
        showShape();
      }, to);
    }

    const resetTimer = () => {
      if (toId) {
        clearTimeout(toId);
        hideShape();
      }
      startTimer();
    }

    // subscribe to changes
    ctx.onChange({ callback: resetTimer });

    hideShape();
    startTimer();
  },
  customProperty: [{
    id: 'timeout',
    label: 'Timout in seconds',
    type: 'text',
    default: 10
  }]
});
