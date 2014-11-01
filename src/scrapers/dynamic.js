/**
 * Sandcrawler Dynamic Scraper
 * ============================
 *
 * A scraper using a phantom engine to perform its tasks. This is
 * sandcrawler default scraper.
 */
var Scraper = require('./abstract.js'),
    util = require('util'),
    script = require('../phantom_script.js'),
    pageLog = require('../plugins/page.js');

/**
 * Main Class
 */
function DynamicScraper(name) {
  var self = this;

  // New safeguard
  if (!(this instanceof DynamicScraper))
    return new DynamicScraper(name);

  // Extending
  Scraper.call(this, name);

  // Properties
  this.type = 'dynamic';

  // Plugins
  this.use(pageLog());

  // Hidden properties
  this._script = null;
  this._calls = [];

  // Listening
  this.on('scaper:cleanup', function() {
    this._calls.forEach(function(call) {
      this.engine.messenger.cancel(call);
    }, this);

    this._script = null;
    this._calls = [];
  });

  this.on('job:scrape', function(job) {

    // Sending message to phantom
    var call = this.engine.messenger.request(

      // We want to scrape
      'scrape',

      // Sent data
      {
        id: job.id,
        url: job.req.url,
        script: this._script,
        timeout: this.params.timeout,
        artooSettings: this.params.artoo,
        pageSettings: this.params.page,
        customHeaders: this.params.headers
      },

      // Request parameters
      {timeout: this.params.timeout},

      // Callback
      function(err, msg) {
        var response = (msg || {}).body || {},
            error;

        // Resolving call
        self._calls.splice(self._calls.indexOf(call), 1);

        // Populating response
        job.res = response;

        if (err)
          return self.emit('job:fail', err, job);

        // Phantom failure
        if (response.fail && response.reason === 'fail') {
          error = new Error('phantom-fail');
          error.code = response.error.errorCode;
          error.reason = response.error.errorString;
          return self.emit('job:fail', error, job);
        }

        // Wrong status code
        if (response.fail && response.reason === 'status') {
          error = new Error('status-' + (response.status || 'unknown'));
          error.status = response.status;
          return self.emit('job:fail', error, job);
        }

        self.emit('job:after', job);
      }
    );

    this._calls.push(call);
  });
}

// Inheriting
util.inherits(DynamicScraper, Scraper);

/**
 * Prototype
 */
DynamicScraper.prototype.script = function(path) {
  if (this._script)
    throw Error('sandcrawler.scraper.script: script already registered.');

  this._script = script.fromFile(path);
  return this;
};

DynamicScraper.prototype.jawascript = function(fn) {
  if (this._script)
    throw Error('sandcrawler.scraper.jawascript: script already registered.');

  if (typeof fn === 'function')
    this._script = script.fromFunction(fn);
  else if (typeof fn === 'string')
    this._script = script.fromString(fn);
  else
    throw Error('sandcrawler.scraper.jawascript: wrong argument.');

  return this;
};


/**
 * Exporting
 */
module.exports = DynamicScraper;
