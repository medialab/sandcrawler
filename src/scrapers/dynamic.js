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
  this.on('job:scrape', function(job) {

    // Sending message to phantom
    this.engine.spy.messenger.request(

      // We want to scrape
      'scrape',

      // Sent data
      {
        id: job.id,
        url: job.req.url,
        scraper: this._script,
        timeout: this.config.timeout
      },

      // Request parameters
      {timeout: this.config.timeout},

      // Callback
      function(err, response) {

        // Populating response
        job.res = response;

        // TODO: deal with various errors
        if (err)
          return self.emit('job:fail', err, job);

        self.emit('job:after', job);
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
