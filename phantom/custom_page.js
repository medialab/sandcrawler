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

// Boostrapping class
function Bootstrap() {
  var self = this;

  // TODO: inject jQuery safely by requesting it with artoo
  // TODO: find a way to setup artoo finely
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
