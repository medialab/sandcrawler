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
function DynamicScraper() {

  // Extending
  Scraper.call(this);
}

// Inheriting
util.inherits(DynamicScraper, Scraper);

/**
 * Exporting
 */
module.exports = DynamicScraper;
