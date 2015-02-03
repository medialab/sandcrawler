/**
 * Sandcrawler Phantom Engine
 * ===========================
 *
 * Using a phantomjs child to scrape the given pages.
 */
var _ = require('lodash'),
    phscript = require('../phantom_script.js');

/**
 * Main
 */
function PhantomEngine(scraper, phantom) {
  var self = this;

  // Properties
  this.type = 'phantom';
  this.phantom = phantom;
  this.calls = [];

  // Fetching method
  this.fetch = function(job, callback) {

    // Figuring timeout
    var timeout = job.req.timeout || scraper.options.timeout;

    var call = this.phantom.request(

      // We ask the phantom child to scrape
      'scrape',

      // Sent data
      {
        url: job.req.url,
        script: scraper.script,
        params: _.merge(scraper.options.params, job.req.params)
      },

      // Request timeout
      {timeout: timeout},

      // Callback
      function(err, msg) {
        var response = (msg || {}).body || {},
            betterError;

        // Resolving call
        _.pullAt(self.calls, self.calls.indexOf(call));

        // Populating response
        job.res = response;

        if (err)
          return callback(err, job);

        // Phantom failure
        if (response.fail && response.reason === 'fail') {
          betterError = new Error('phantom-fail');
          betterError.code = response.error.errorCode;
          betterError.reason = response.error.errorString;
          return callback(betterError, job);
        }

        // Wrong status code
        if (response.fail && response.reason === 'status') {
          betterError = new Error('status-' + (response.status || 'unknown'));
          betterError.status = response.status;
          return callback(betterError, job);
        }

        return callback(null, job);
      }
    );

    this.calls.push(call);
  };
}

/**
 * Exporting
 */
module.exports = PhantomEngine;
