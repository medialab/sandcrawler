/**
 * Sandcrawler Dynamic Scraper
 * ============================
 *
 * A scraper using a phantom engine to perform its tasks. This is
 * sandcrawler default scraper.
 */
var Scraper = require('./abstract.js'),
    util = require('util'),
    script = require('../phantom_script.js');

/**
 * Main Class
 */
function DynamicScraper() {

  // Extending
  Scraper.call(this);

  // Properties
  this.type = 'dynamic';

  // Hidden properties
  this._script = null;

  // Listening
  this.on('page:scrape', function(page) {
    console.log('scrape', page);
  });
}

// Inheriting
util.inherits(DynamicScraper, Scraper);

/**
 * Hidden prototype
 */
DynamicScraper.prototype.scrape = function() {

};

/**
 * Prototype
 */
DynamicScraper.prototype.script = function(path) {
  this._script = script.fromFile(path);
  return this;
};


/**
 * Exporting
 */
module.exports = DynamicScraper;
