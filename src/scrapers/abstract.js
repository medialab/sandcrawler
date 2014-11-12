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
    state = require('../plugins/state.js'),
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
  this.index = 0;
  this.jobCounter = 0;
  this.engine = null;
  this.settings = defaults.scraper;
  this.state = {
    locked: false,
    paused: false,
    running: false,
    done: false
  };

  // Hidden properties
  this._iterator = null;
  this._jobs = [];
  this._stack = [];
  this._remains = [];

  this._middlewares = {
    before: [],
    beforeScraping: [],
    afterScraping: []
  };

  // State listeners
  this.use(state());
}

// Inheriting
util.inherits(Scraper, EventEmitter);

/**
 * Hidden Prototype
 */

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

// Initializing job object
Scraper.prototype._wrapJob = function(mixed) {
  var job = {
    id: 'Job[' + uuid.v4() + ']',
    original: mixed,
    state: {
      discarded: false,
      done: false,
      failing: false,
      retrying: false
    },
    req: {
      index: this.jobCounter++,
      retries: 0,
      data: {},
      params: {}
    },
    res: {}
  };

  // Binding methods
  job.req.retry = this._retryJob.bind(this, job);
  job.req.retryNow = this._retryJob.bind(this, job, 'now');
  job.req.retryLater = this._retryJob.bind(this, job, 'later');

  // Populating
  if (types.get(mixed) === 'string') {
    job.req.url = mixed;
  }
  else {

    // Safeguard
    if (!mixed.url)
      throw Error('sandcrawler.scraper._wrapJob: no url provided.');

    job.req.url = mixed.url;
    job.req.data = mixed.data || {};
    job.req.params = mixed.params || {};

    if (mixed.timeout)
      job.req.timeout = mixed.timeout;
  }

  return job;
};

// Set or reset a job's state
Scraper.prototype._resetJobState = function(job) {
  job.state.retrying = false;
  job.state.failing = false;
  return this;
};

// Performing next job
Scraper.prototype._nextJob = function(lastJob) {

  // Running iterator if needed
  if (this._iterator &&
      !this._jobs.length &&
      ((this.index && lastJob) || true)) {

    // We call the iterator
    var feed = this._iterator.call(this,
      this.index,
      (lastJob || {}).req,
      (lastJob || {}).res
    );

    // If a feed was returned, we add it to the jobs
    if (feed) this.addUrl(feed);
  }

  // Did we run dry or did we hit the limit?
  if ((!this._jobs.length && !this._stack.length) ||
      (this.settings.limit && this.index >= this.settings.limit))
    return this.emit('scraper:success');

  // Adding a job to the stack if possible
  if (this._jobs.length) {
    this._stack.unshift(this._jobs.shift());

    // Reinitializing state
    this._resetJobState(this._stack[0]);
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

// Discard a job
Scraper.prototype._discardJob = function(job, reason) {

  // State
  job.state.discarded = true;

  // Dropping from stack
  var idx = _.findIndex(this._stack, function(e) {
    return e.id === job.id;
  });

  this._stack.splice(idx, 1);

  // Emitting
  this.emit('job:discard', reason, job);

  // Next job
  this._nextJob(job);
};

// Retry a job
Scraper.prototype._retryJob = function(job, when) {

  // If the job is not failing, we shan't retry
  if (!job.state.failing)
    return;

  // If we hit the max retry
  if (job.req.retries >= this.settings.maxRetries)
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

// Wrapping a remain
Scraper.prototype._wrapRemain = function(job, err) {
  return {
    job: job.original,
    error: helpers.extend(err, {message: err.message})
  };
};

// Cleaning internals
Scraper.prototype._cleanup = function() {

  // Emitting cleanup hook
  this.emit('scraper:cleanup');

  // Removing every event listeners
  this.removeAllListeners();

  // Cleaning properties
  this.engine = null;

  // Cleaning hidden properties
  this._iterator = null;
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
  this.settings = helpers.extend(o, this.settings);
  return this;
};

// Shorthands
Scraper.prototype.limit = function(nb) {
  this.settings = helpers.extend({limit: nb}, this.settings);
  return this;
};

Scraper.prototype.timeout = function(nb) {
  this.settings = helpers.extend({timeout: nb}, this.settings);
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

// Exiting the scraper
Scraper.prototype.exit = function(err) {
  return this.emit('scraper:fail', err || new Error('exited'));
};

/**
 * Exporting
 */
module.exports = Scraper;
