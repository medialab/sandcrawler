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
    config = require('../../config.json'),
    _ = require('lodash');

/**
 * Main Class
 */
function Scraper() {
  var self = this;

  // Extending event emitter
  EventEmitter.call(this);

  // Assigning a unique identifer
  this.id = 'Scraper[' + uuid.v4() + ']';

  // Properties
  this.engine = null;
  this.done = false;
  this.config = config.scraper;

  // Hidden properties
  this._jobs = [];
  this._stack = [];
  this._middlewares = {
    before: [],
    beforeScraping: [],
    afterScraping: []
  };

  // Scraper-level listeners
  this.once('scraper:before', function() {

    // Applying before middlewares
    async.applyEachSeries(
      this._middlewares.before,
      function(err) {

        // If an error occured, the scraper failed
        if (err)
          return self.emit('scraper:fail', err);

        // Otherwise, we start
        self.emit('scraper:start');
      }
    );
  });

  this.once('scraper:start', function() {

    for (var i = 0; i < this.config.maxConcurrency; i++)
      this._next();
  });

  // Job-level listeners
  this.on('job:before', function(job) {

    // Applying beforeScraping middlewares
    async.applyEachSeries(
      this._middlewares.beforeScraping,
      job.req,
      function(err) {
        // TODO: handle error

        // Otherwise we start scraping
        self.emit('job:scrape', job);
      }
    );
  });

  this.on('job:after', function(job) {

    // Applying afterScraping middlewares
    async.applyEachSeries(
      this._middlewares.afterScraping,
      job.req,
      job.res,
      function(err) {
        if (err)
          return self.emit('job:fail', err, job);

        self.emit('job:success', job);
      }
    );
  });
}

// Inheriting
util.inherits(Scraper, EventEmitter);

/**
 * Hidden Prototype
 */
Scraper.prototype._wrapJob = function(mixed) {
  var job = {
    id: 'Job[' + uuid.v4() + ']',
    req: {
      retries: 0,
      retry: null,
      delay: null,
      params: {}
    },
    res: {}
  };

  if (types.get(mixed) === 'string')
    job.req.url = mixed;
  else
    throw Error('unsupported feed right now');

  return job;
};

Scraper.prototype._run = function(engine, callback) {

  this.engine = engine;

  // Dispatching
  this.emit('scraper:before');

  // Listening to scraper
  this.once('scraper:success', function() {
    this.emit('scraper:end', 'success');
  });

  this.once('scraper:fail', function() {
    this.emit('scraper:end', 'fail');
  });

  this.once('scraper:end', function() {
    this.done = true;
  });

  // Listening to jobs
  this.on('job:fail', function(err, job) {
    this.emit('job:end', job);
  });

  this.on('job:success', function(job) {
    this.emit('job:end', job);
  });

  this.on('job:end', function(job) {

    // Removing page from stack
    var idx = _.findIndex(this._stack, function(e) {
      return e.id === job.id;
    });

    this._stack.splice(idx, 1);

    if (!this._jobs.length)
      this.emit('scraper:success');
    else
      this._next();
  });

  // Listening to scraper ending
  // TODO: provide autoclose here
  this.on('scraper:fail', callback);
  this.on('scraper:success', function() {
    callback(null);
  });

  return this;
};

Scraper.prototype._next = function() {
  this._stack.unshift(this._jobs.shift());
  this.emit('job:before', this._stack[0]);

  return this;
};

/**
 * Prototype
 */

// Assigning a single url
Scraper.prototype.url = function(singleUrl) {

  // TODO: type checking
  this._jobs.push(this._wrapJob(singleUrl));

  return this;
};

// Alias
Scraper.prototype.urls = Scraper.prototype.url;

// Configurin gthe scraper
Scraper.prototype.config = function(o) {
  this.config = helpers.extend(o, this.config);
  return this;
};

// Registering a processing callback
Scraper.prototype.result = function(fn) {

  if (typeof fn !== 'function')
    throw Error('sandcrawler.scraper.result: given argument is not a function.');

  // Binding listeners
  this.on('job:success', function(job) {
    fn.call(this, null, job.req, job.res);
  });

  this.on('job:fail', function(err, job) {
    fn.call(this, err, job.req, job.res);
  });

  return this;
};

/**
 * Exporting
 */
module.exports = Scraper;
