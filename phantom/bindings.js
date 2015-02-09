/**
 * Sandcrawler Phantom Bothan Bindings
 * ====================================
 *
 * Defines how phantom child processes should behave when controlled by
 * a sandcrawler instance.
 */

// Extensions
require('./extensions.js');

// Requiring orders
var orders = {
  scrape: require('./orders/scrape.js')
};

module.exports = function(parent, params) {

  // Registering orders
  parent.on('scrape', orders.scrape(parent, params));
};
