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
    helpers = require('../helpers.js'),
    defaults = require('../../defaults.json'),
    validate = require('../plugins/validate.js'),
    runtime = require('../plugins/runtime.js'),
    _ = require('lodash');

/**
 * Main Class
 */
function Scraper(name) {
  var self = this;

  // Extending event emitter
  EventEmitter.call(this);

  // Assigning a unique identifer
  this.id = 'Scraper[' + uuid.v4() + ']';
  this.name = name || this.id.substr(0, 16) + ']';

  // Properties
  this.engine = null;
  this.params = defaults.scraper;
  this.state = {
    paused: false,
    running: false,
    done: false
  };

  // Hidden properties
  this._iterator = null;
  this._doneCount = 0;
  this._jobs = [];
  this._stack = [];
  this._remains = [];

  this._middlewares = {
    before: [],
    beforeScraping: [],
    afterScraping: []
  };
}

// Inheriting
util.inherits(Scraper, EventEmitter);

/**
 * Hidden Prototype
 */

// Initializing job object
Scraper.prototype._wrapJob = function(mixed) {
  var job = {
    id: 'Job[' + uuid.v4() + ']',
    original: mixed,
    state: {
      failing: false,
      retrying: false
    },
    req: {
      retries: 0
    },
    res: {}
  };

  // Binding methods
  job.req.retry = this._retryJob.bind(this, job);
  job.req.retryNow = this._retryJob.bind(this, job, 'now');
  job.req.retryLater = this._retryJob.bind(this, job, 'later');

  // Populating
  if (types.get(mixed) === 'string') {
    job.req.url = decodeURIComponent(mixed);
  }
  else {
    job.req.url = decodeURIComponent(mixed.url);
    job.req.params = mixed;
  }

  return job;
};

// Running the scraper
Scraper.prototype._run = function(engine, callback) {

  this.engine = engine;
  this.state.running = true;

  // Deploying runtime
  this.use(runtime(callback));

  // Dispatching before event so the lifecycle can start
  this.emit('scraper:before');

  return this;
};

// Performing next job
Scraper.prototype._nextJob = function(lastJob) {

  // Running iterator if needed
  if (this._iterator &&
      !this._jobs.length &&
      ((this._doneCount && lastJob) || true)) {

    // We call the iterator
    var feed = this._iterator.call(this,
      this._doneCount,
      (lastJob || {}).req,
      (lastJob || {}).res
    );

    // If a feed was returned, we add it to the jobs
    if (feed) this.addUrl(feed);
  }

  // Did we run dry or did we hit the limit?
  if ((!this._jobs.length && !this._stack.length) ||
      (this.params.limit && this._doneCount >= this.params.limit))
    return this.emit('scraper:success');

  // Adding a job to the stack if possible
  if (this._jobs.length) {
    this._stack.unshift(this._jobs.shift());

    // Reinitializing state
    this._stack[0].state.retrying = false;
    this._stack[0].state.failing = false;
    this.emit('job:before', this._stack[0]);
  }

  return this;
};

// Retrieve a job in the stack by its id
Scraper.prototype._findJob = function(id) {
  return _.find(this._stack, function(j) {
    return id === j.id;
  });
};

// Retry a job
Scraper.prototype._retryJob = function(job, when) {

  // If we hit the max retry
  if (job.req.retries >= this.params.maxRetries)
    return;

  // If the job is already retrying, we stop
  if (job.state.retrying)
    return;

  // By default, we retry later
  when = when || 'later';

  // Assigning a retry value
  job.state.retrying = true;

  // Incrementing the number of retries
  job.req.retries++;

  // Dropping from stack
  var idx = _.findIndex(this._stack, function(e) {
    return e.id === job.id;
  });

  this._stack.splice(idx, 1);

  // Reinstating in the job stack at the desired position
  this._jobs[when === 'now' ? 'unshift' : 'push'](job);

  // Emitting
  this.emit('job:retry', job);
};

// Cleaning internals
Scraper.prototype._cleanup = function() {

  // Removing every event listeners
  this.removeAllListeners();

  // Cleaning properties
  this.engine = null;
  this.params = defaults.scraper;
  this.state = {
    paused: false,
    running: false,
    done: false
  };

  // Cleaning hidden properties
  this._iterator = null;
  this._doneCount = 0;
  this._jobs = [];
  this._stack = [];
  this._remains = [];

  // Cleaning hidden properties
  this._middlewares = {
    before: [],
    beforeScraping: [],
    afterScraping: []
  };
};


/**
 * Prototype
 */

// Assigning a single url
Scraper.prototype.url = function(feed) {
  var list;

  // TODO: more precise type checking
  if (!types.check(feed, 'string|array|object'))
    throw Error('sandcrawler.scraper.url(s): wrong argument.');

  list = !(feed instanceof Array) ? [feed] : feed;

  list.forEach(function(item) {
    this._jobs.push(this._wrapJob(item));
  }, this);

  return this;
};

// Adding a new url during runtime
Scraper.prototype.addUrl = function(feed) {
  var list;

  // TODO: more precise type checking
  if (!types.check(feed, 'string|array|object'))
    throw Error('sandcrawler.scraper.addUrl(s): wrong argument.');

  list = !(feed instanceof Array) ? [feed] : feed;

  list.forEach(function(item) {
    var job = this._wrapJob(item);
    this._jobs.push(job);

    // Emitting
    this.emit('job:added', job);
  }, this);

  return this;
};

// Aliases
Scraper.prototype.urls = Scraper.prototype.url;
Scraper.prototype.addUrls = Scraper.prototype.addUrl;

// Using an url iterator
Scraper.prototype.iterate = function(fn) {

  if (typeof fn !== 'function')
    throw Error('sandcrawler.scraper.iterate: given argument is not a function.');

  if (this._iterator)
    throw Error('sandcrawler.scraper.iterate: iterator has already been provided.');

  this._iterator = fn;

  return this;
};

// Configuring the scraper
Scraper.prototype.config = function(o) {
  this.params = helpers.extend(o, this.params);
  return this;
};

// Shorthands
Scraper.prototype.limit = function(nb) {
  this.params = helpers.extend({limit: nb}, this.params);
  return this;
};

Scraper.prototype.timeout = function(nb) {
  this.params = helpers.extend({timeout: nb}, this.params);
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

// Registering a beforeScraping middleware
Scraper.prototype.beforeScraping = function(fn) {

  if (typeof fn !== 'function')
    throw Error('sandcrawler.scraper.beforeScraping: given argument is not a function');

  this._middlewares.beforeScraping.push(fn);

  return this;
};

// Registering an afterScraping middleware
Scraper.prototype.afterScraping = function(fn) {

  if (typeof fn !== 'function')
    throw Error('sandcrawler.scraper.afterScraping: given argument is not a function');

  this._middlewares.afterScraping.push(fn);

  return this;
};

// Using a plugin
Scraper.prototype.use = function(fn) {
  if (typeof fn !== 'function')
    throw Error('sandcrawler.scraper.afterScraping: given argument is not a function');

  fn.call(this, this);

  return this;
};

// Data validation
Scraper.prototype.validate = function(definition) {
  return this.use(validate(definition));
};

// Pausing the scraper
Scraper.prototype.pause = function() {
  return this.emit('scraper:pause');
};

// Resuming
Scraper.prototype.resume = function() {
  return this.emit('scraper:resume');
};

/**
 * Exporting
 */
module.exports = Scraper;
