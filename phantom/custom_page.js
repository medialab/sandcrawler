/**
 * Bothan Webpage Enhancement
 * ===========================
 *
 * Light boostrap on phantomjs' webpage to provide for easy logging in the
 * parent process.
 */

// TODO: find another way to handle exception than with console.error
var webpage = require('webpage'),
    settings = null;

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
function Bootstrap() {
  var self = this;

  // Private
  listeners = {};

  // Binding new callbacks
  function bindCallback(e) {
    self['on' + capitalize(e)] = function() {
      var args = Array.prototype.slice.call(arguments);

      listeners[e].forEach(function(fn) {
        fn.apply(self, args);
      });
    };
  }

  EVENTS.forEach(function(e) {
    listeners[e] = [];

    bindCallback(e);
  });

  // Adding methods
  this.on = function(name, fn) {
    if (!~EVENTS.indexOf(name))
      throw Error('bothan.phantom.page.on: unknown event "' + name + '".');

    listeners[name].push(fn);

    return this;
  };

  // TODO: inject jQuery safely
  this.injectArtoo = function() {
    this.injectJs(settings.paths.jquery);
    this.injectJs(settings.paths.artoo);
  };
}

// Exporting an API similar to webpage's
module.exports = {
  setup: function(params) {
    settings = params;
  },
  create: function() {
    var page = webpage.create();

    // Enhancing
    Bootstrap.call(page);

    // Returning the modified page
    return page;
  }
};
