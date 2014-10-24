/**
 * Sandcrawler Dynamic Scraper
 * ============================
 *
 * A scraper using a phantom engine to perform its tasks. This is
 * sandcrawler default scraper.
 */
var Scraper = require('./abstract.js'),
    util = require('util');

/**
 * Main Class
 */
function StaticScraper() {
  var self = this;

  // Extending
  Scraper.call(this);
}

// Inheriting
util.inherits(StaticScraper, Scraper);

/**
 * Prototype
 */

/**
 * Exporting
 */
module.exports = StaticScraper;
