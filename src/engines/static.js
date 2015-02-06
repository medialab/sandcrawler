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
function StaticEngine(spider) {

  this.type = 'static';

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
      if (spider.parser) {
        var $ = cheerio.load(job.res.body);
        job.res.data = spider.parser.call(spider, $, artoo);
      }

      return callback(null, job);
    });
  };
}

/**
 * Exporting
 */
module.exports = StaticEngine;
