/**
 * Sandcrawler Webpage Enhancement
 * ================================
 *
 * Light boostrap on phantomjs' webpage to provide for easy handling.
 */

var webpage = require('webpage'),
    settings = null;

// Boostrapping class
function Bootstrap(lifespan) {
  var self = this;

  // Fallback response object
  this.response = {};

  // TODO: inject jQuery safely by requesting it with artoo
  // TODO: find a way to setup artoo finely
  this.injectArtoo = function() {

    // jQuery
    this.injectJs(settings.paths.jquery);

    // artoo settings
    this.evaluate(function() {
      var settings = document.createElement('div');
      settings.setAttribute('id', 'artoo_injected_script');
      settings.setAttribute('settings', '{"log":{"welcome": false}}');

      document.body.appendChild(settings);
    });

    // artoo
    this.injectJs(settings.paths.artoo);
  };

  // Kill
  this.cleanup = function() {
    if (this.timeout)
      clearTimeout(this.timeout);

    this.close();
  };

  // Creating timeout
  this.timeout = setTimeout(this.cleanup.bind(this), lifespan);
}

// Exporting an API similar to webpage's
module.exports = {
  setup: function(params) {
    settings = params;
  },
  create: function(lifespan) {
    var page = webpage.create();

    // Enhancing
    Bootstrap.call(page, lifespan);

    // Returning the modified page
    return page;
  }
};
