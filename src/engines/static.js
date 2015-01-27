/**
 * Sandcrawler Static Engine
 * ==========================
 *
 * Using request to retrieve given urls statically.
 */
var request = require('request'),
    artoo = require('artoo-js'),
    cheerio = require('cheerio');

// TODO: shim, remove when artoo get released
artoo.helpers.isSelector = function(v) {
  return !!(v && v.prototype && v.prototype.cheerio &&
            v.prototype.cheerio === '[cheerio object]') ||
         !!(v._root && v.options && 'normalizeWhitespace' in v.options);
};

// Bootstrapping cheerio
artoo.bootstrap(cheerio);

/**
 * Main
 */
function StaticEngine(scraper) {

  this.type = 'static';
  var parser = Function.prototype;

  // Fetching method
  this.fetch = function(job, callback) {

    request(job.req.url, function(err, response, body) {

      // If an error occurred
      if (err) return callback(err);

      // Overloading
      job.res.body = body;
      job.res.status = response.statusCode;

      // Status error
      if (response.statusCode >= 400) {
        var error = new Error('status-' + (response.statusCode || 'unknown'));
        error.status = response.statusCode;
        return callback(error);
      }

      // Parsing
      if (parser) {
        var $ = cheerio.load(job.res.body);
        job.res.data = parser.call(scraper, $, artoo);
      }

      return callback(null);
    });
  };

  // Extending the scraper instance
  scraper.parse = function(fn) {

    if (typeof fn !== 'function')
      throw Error('sandcrawler.engines.static.parse: given argument is not a function.');

    parser = fn;

    return this;
  };
}

/**
 * Exporting
 */
module.exports = StaticEngine;
