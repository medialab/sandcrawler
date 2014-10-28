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
    defaults = require('../../defaults.json'),
    validate = require('../plugins/validate.js'),
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
    job.req.url = mixed;
  }
  else {
    job.req.url = mixed.url;
    job.req.params = mixed;
  }

  return job;
};

// Running the scraper
Scraper.prototype._run = function(engine, callback) {

  this.engine = engine;
  this.state.running = true;

  this.once('scraper:start', function() {
    var limit = Math.min(this.params.maxConcurrency, this._jobs.length || 1);

    for (var i = 0; i < limit; i++)
      this._nextJob();
  });

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
    this.state.done = true;
  });

  // Listening to jobs
  this.on('job:fail', function(err, job) {
    job.state.failing = true;
    this.emit('job:end', job);
  });

  this.on('job:success', function(job) {
    this.emit('job:end', job);
  });

  this.on('job:end', function(job) {

    // If retrying, we skip to the next job
    if (job.state.retrying)
      return this._nextJob();

    // A job has been done, we increment the count
    this._doneCount++;

    // Removing page from stack
    var idx = _.findIndex(this._stack, function(e) {
      return e.id === job.id;
    });

    // If the job is failing, we add it to the remains
    if (job.state.failing)
      this._remains.push(job.original);

    this._stack.splice(idx, 1);
    this._nextJob(job);
  });

  // Listening to scraper ending
  this.on('scraper:fail', function(err) {
    callback(err, this._remains);
  });

  this.on('scraper:success', function() {
    callback(null, this._remains);
  });

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

    // Reinitializing "retrying" flag
    this._stack[0].state.retrying = false;
    this.emit('job:before', this._stack[0]);
  }

  return this;
};

// Retrieve a job in the stack by its id
Scraper.prototype._findJob = function(id) {
  var job = _.find(this._stack, function(j) {
    return id === j.id;
  });

  if (!job)
    throw Error('sandcrawler.scraper._findJob: trying to retrieve an ' +
                'inexistant job in the stack.');

  return job;
};

// Retry a job
Scraper.prototype._retryJob = function(job, when) {

  // By default, we retry later
  when = when || 'later';

  // Assigning a retry value
  job.state.retrying = true;

  // Incrementing the number of retries
  job.req.retries++;

  // TODO: maxRetries

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
    running: false,
    done: false
  };

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
  this.params = helpers.extend(o, this.params);
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

/**
 * Exporting
 */
module.exports = Scraper;
