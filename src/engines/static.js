/**
 * Sandcrawler Static Engine
 * ==========================
 *
 * Using request to retrieve given urls statically.
 */
var request = require('request'),
    artoo = require('artoo-js'),
    cheerio = require('cheerio');

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
      if (spider.scraperScript) {
        var $ = cheerio.load(job.res.body);

        if (spider.synchronousScraperScript) {
          try {
            job.res.data = spider.scraperScript.call(spider, $);
          }
          catch (e) {
            return callback(e);
          }

          return callback(null, job.res.data);
        }
        else {
          try {
            spider.scraperScript.call(spider, $, function(err, data) {
              job.res.data = data;
              return callback(err, data);
            });
          }
          catch (e) {
            return callback(e);
          }
        }
      }
      else {
        return callback(null, job);
      }
    });
  };
}

/**
 * Exporting
 */
module.exports = StaticEngine;
