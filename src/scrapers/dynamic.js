/**
 * Sandcrawler Dynamic Scraper
 * ============================
 *
 * A scraper using a phantom engine to perform its tasks. This is
 * sandcrawler default scraper.
 */
var Scraper = require('./abstract.js'),
    util = require('util'),
    phscript = require('../phantom_script.js'),
    pageLog = require('../plugins/page.js'),
    helpers = require('../helpers.js');

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

  this._listeners = {
    crash: function() {

      // Terminating ongoing calls and failing the scraper
      this.emit('scraper:fail', new Error('phantom-crash'));
    }
  };

  // Hooking on phantom exit for safety
  this.once('scraper:before', function() {

    this.engine.once('phantom:crash', this._listeners.crash);
  });

  // Listening
  this.once('scraper:cleanup', function() {
    this._calls.forEach(function(call) {
      this.engine.messenger.cancel(call);
    }, this);

    this._script = null;
    this._calls = [];

    // Removing engine listeners
    this.engine.removeListener('phantom:crash', this._listeners.crash);
  });

  this.on('job:scrape', function(job) {
    var timeout = job.req.timeout || this.settings.timeout;

    // Sending message to phantom
    var call = this.engine.messenger.request(

      // We want to scrape
      'scrape',

      // Sent data
      {
        id: job.id,
        url: job.req.url,
        script: this._script,
        params: helpers.extend(job.req.params, this.settings.params)
      },

      // Request parameters
      {timeout: timeout},

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
DynamicScraper.prototype.script = function(path, check) {
  if (this._script)
    throw Error('sandcrawler.scraper.script: script already registered.');

  this._script = phscript.fromFile(path, check);
  return this;
};

DynamicScraper.prototype.jawascript = function(fn, check) {
  if (this._script)
    throw Error('sandcrawler.scraper.jawascript: script already registered.');

  if (typeof fn === 'function')
    this._script = phscript.fromFunction(fn, check);
  else if (typeof fn === 'string')
    this._script = phscript.fromString(fn, check);
  else
    throw Error('sandcrawler.scraper.jawascript: wrong argument.');

  return this;
};


/**
 * Exporting
 */
module.exports = DynamicScraper;
