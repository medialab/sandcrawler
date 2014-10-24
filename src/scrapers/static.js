/**
 * Sandcrawler Dynamic Scraper
 * ============================
 *
 * A scraper using a phantom engine to perform its tasks. This is
 * sandcrawler default scraper.
 */
var Scraper = require('./abstract.js'),
    util = require('util'),
    request = require('request'),
    artoo = require('artoo-js'),
    cheerio = require('artoo-js/node_modules/cheerio');

/**
 * Main Class
 */
function StaticScraper() {
  var self = this;

  // Extending
  Scraper.call(this);

  // Hidden properties
  this._parser = null;

  // Listerning
  this.on('job:scrape', function(job) {
    request(job.req.url, function(err, response, body) {

      // Overloading job's response
      job.res.body = body;

      // TODO: harsh refining and options.
      if (err) return self.emit('job:fail', err, job);

      // Do parsing
      if (self._parser) {
        var $ = cheerio.load(job.res.body);
        job.res.data = self._parser.call(self, $, artoo);
      }

      self.emit('job:after', job);
    });
  });
}

// Inheriting
util.inherits(StaticScraper, Scraper);

/**
 * Prototype
 */
StaticScraper.prototype.parse = function(fn) {
  if (this._parser)
    throw Error('sandcrawler.scraper.parse: parser already registered.');

  if (typeof fn !== 'function')
    throw Error('sandcrawler.scraper.parse: given argument is not a function.');

  this._parser = fn;

  return this;
};

/**
 * Exporting
 */
module.exports = StaticScraper;
