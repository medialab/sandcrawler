/**
 * Sandcrawler Abstract Scraper
 * =============================
 *
 * Spine of the sandcrawler's scrapers containing every generic logic working
 * for each of its declinaisons.
 */
var EventEmitter = require('events').EventEmitter,
    util = require('util'),
    uuid = require('uuid'),
    types = require('typology'),
    async = require('async'),
    helpers = require('../helpers.js'),
    config = require('../../config.json');

/**
 * Main Class
 */
function Scraper() {
  var self = this;

  // Extending event emitter
  EventEmitter.call(this);

  // Assigning a unique identifer
  this.id = 'Task[' + uuid.v4() + ']';

  // Properties
  this.engine = null;
  this.config = config.scraper;

  // Hidden properties
  this._pages = [];
  this._stack = [];
  this._middlewares = {
    before: [],
    beforeScraping: [],
    afterScraping: []
  };

  // Listening
  this.once('task:before', function() {

    // Applying before middlewares
    async.applyEachSeries(
      this._middlewares.before,
      function(err) {

        // If an error occured, the task failed
        if (err)
          return self.emit('task:fail', err);

        // Otherwise, we start
        self.emit('task:start');
      }
    );
  });

  this.once('task:start', function() {

    // TODO: concurrency
    this._stack.unshift(this._pages.shift());
    this.emit('page:before', this._stack[0]);
  });

  this.on('page:before', function(page) {

    // Applying beforeScraping middlewares
    async.applyEachSeries(
      this._middlewares.beforeScraping,
      page,
      function(err) {
        // TODO: handle error

        // Otherwise we start scraping
        self.emit('page:scrape', page);
      }
    );
  });

  this.once('task:success', function() {
    this.emit('task:end', 'success');
  });

  this.once('task:fail', function() {
    this.emit('task:end', 'fail');
  });
}

// Inheriting
util.inherits(Scraper, EventEmitter);

/**
 * Hidden Prototype
 */
Scraper.prototype._wrapPage = function(mixed) {
  var page = {
    id: 'Page[' + uuid.v4() + ']',
    retries: 0
  };

  if (types.get(mixed) === 'string')
    page.url = mixed;
  else
    page = helpers.extend(mixed, page);

  return page;
};

Scraper.prototype._run = function(engine) {

  this.engine = engine;

  // Dispatching
  this.emit('task:before');
};

/**
 * Prototype
 */

// Assigning a single url
Scraper.prototype.url = function(singleUrl) {

  // TODO: type checking
  this._pages.push(this._wrapPage(singleUrl));

  return this;
};

// Alias
Scraper.prototype.urls = Scraper.prototype.url;

// Configurin gthe scraper
Scraper.prototype.config = function(o) {
  this.config = helpers.extend(o, this.config);
};

// Registering a processing callback
Scraper.prototype.result = function(fn) {

  if (typeof fn !== 'function')
    throw Error('sandcrawler.scraper.result: given argument is not a function.');

  // TODO: actual code
  return this;
};

/**
 * Exporting
 */
module.exports = Scraper;
