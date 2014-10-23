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
  var self = this;

  // Extending
  Scraper.call(this);

  // Properties
  this.type = 'dynamic';

  // Hidden properties
  this._script = null;

  // Listening
  this.on('page:scrape', function(page) {
console.log(page);
    // Sending message to phantom
    this.engine.spy.messenger.request(

      // We want to scrape
      'scrape',

      // Sent data
      {
        id: page.id,
        url: page.url,
        scraper: this._script,
        timeout: this.config.timeout
      },

      // Request parameters
      {timeout: this.config.timeout},

      // Callback
      function(err, response) {
console.log(response);
        page.data = response.data;

        // TODO: deal with various errors
        if (err)
          return self.emit('page:fail', err, page);

        self.emit('page:after', page);
      }
    );
  });
}

// Inheriting
util.inherits(DynamicScraper, Scraper);

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
