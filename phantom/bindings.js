/**
 * Sandcrawler Phantom Bothan Bindings
 * ====================================
 *
 * Defines how phantom child processes should behave when controlled by
 * a sandcrawler instance.
 */
var polyfills = require('./polyfills.js'),
    orders = {
      scrape: require('./orders/scrape.js')
    };

module.exports = function(parent, params) {

  // Registering orders
  parent.on('scrape', orders.scrape(parent, params));
};
