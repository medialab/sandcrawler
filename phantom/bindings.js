/**
 * Sandcrawler Phantom Bothan Bindings
 * ====================================
 *
 * Defines how phantom child processes should behave when controlled by
 * a sandcrawler instance.
 */

// Requiring orders
var orders = {
  scrape: require('./orders/scrape.js')
};

// Polyfilling only if not in phantomjs 2
if (phantom.version.major < 2)
  var polyfills = require('./polyfills');

module.exports = function(parent, params) {

  // Registering orders
  parent.on('scrape', orders.scrape(parent, params));
};
