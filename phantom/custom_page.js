/**
 * Bothan Webpage Enhancement
 * ===========================
 *
 * Light boostrap on phantomjs' webpage to provide for easy logging in the
 * parent process.
 */
var webpage = require('webpage');

// Constants
var EVENTS = [
  'alert',
  'callback',
  'closing',
  'confirm',
  'consoleMessage',
  'error',
  'filePicker',
  'initialized',
  'loadFinished',
  'navigationRequested',
  'pageCreated',
  'prompt',
  'resourceError',
  'resourceReceived',
  'resourceRequested',
  'resourceTimeout',
  'urlChanged'
];

// Helpers
function capitalize(s) {
  return s.charAt(0).toUpperCase() + s.slice(1);
}

// Boostrapping class
function Bootstrap(page) {

  // Private
  listeners = {};

  // Binding new callbacks
  function bindCallback(e) {
    page['on' + capitalize(e)] = function() {
      var args = Array.prototype.slice.call(arguments);

      listeners[e].forEach(function(fn) {
        fn.apply(page, args);
      });
    };
  }

  EVENTS.forEach(function(e) {
    listeners[e] = [];

    bindCallback(e);
  });

  // Adding methods
  page.on = function(name, fn) {
    if (!(name in EVENTS))
      throw 'bothan.phantom.page.on: unknown event "' + name + '".';

    listeners[name].push(fn);
  };
}

// Exporting an API similar to webpage's
module.exports = {
  create: function() {
    var page = webpage.create();

    // Enhancing
    Bootstrap.call(page);

    // Returning the modified page
    return page;
  };
};
