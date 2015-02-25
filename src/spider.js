/**
 * Sandcrawler Spider Abstraction
 * ================================
 *
 * Abstract spider definition on which one should should mount an precise
 * engine to actually work.
 *
 * The intention here is to clearly separate the spider's logic from its means.
 */
var EventEmitter = require('events').EventEmitter,
    FileCookieStore = require('tough-cookie-filestore'),
    types = require('./typology.js'),
    nodeUrl = require('url'),
    util = require('util'),
    uuid = require('uuid'),
    async = require('async'),
    fse = require('fs-extra'),
    request = require('request'),
    throttle = require('./plugins/throttle.js'),
    validate = require('./plugins/validate.js'),
    stats = require('./plugins/stats.js'),
    helpers = require('./helpers.js'),
    extend = helpers.extend,
    defaults = require('../defaults.json').spider,
    _ = require('lodash');

/**
 * Main
 */
function Spider(name, engine) {
  var self = this;

  // Events
  EventEmitter.call(this);

  // Assigning a unique identifer
  this.id = 'Spider[' + uuid.v4() + ']';
  this.name = name || this.id.substr(0, 16) + ']';

  // Properties
  this.options = extend(defaults);
  this.engine = new engine(this);
  this.jar = null;
  this.type = this.engine.type;
  this.remains = {};
  this.index = 0;
  this.lastJob = null;
  this.state = {
    fulfilled: false,
    locked: false,
    paused: false,
    running: false
  };

  // Additional properties
  this.scraperScript = null;
  this.synchronousScraperScript = false;
  this.iterator = null;

  // Queue
  this.queue = async.queue(function(job, callback) {

    // Resetting state
    job.state = {
      retrying: false,
      failing: false
    };

    // Emitting
    self.emit('job:start', job);

    // Apply before middlewares so we can tell if the job needs discarding
    beforeScraping.call(self, job, function(err) {
      if (err) {

        // Discarding...
        self.emit('job:discard', err, job);
        return callback(err);
      }

      // Processing one job through the pipe
      self.index++;
      self.emit('job:scrape', job);

      return async.applyEachSeries([
        scrape.bind(self),
        afterScraping.bind(self)
      ], job, function(err, results) {

        if (err) {
          job.res.error = err;

          // Retry?
          if (self.options.autoRetry) {
            retryJob.call(self, job, self.options.autoRetry === 'later' ? 'later' : 'now');
          }
          else {
            job.req.retry = retryJob.bind(self, job);
            job.req.retryLater = job.req.retry;
            job.req.retryNow = retryJob.bind(self, job, 'later');
          }

          // Updating remains
          self.remains[job.id] = {
            error: helpers.serializeError(err),
            job: job
          };

          // Failing the job
          job.state.failing = true;
          self.emit('job:fail', err, job);

          delete job.req.retry;
          delete job.req.retryLater;
          delete job.req.retryNow;

          // If the job is not retried even though we declared it failing
          // we call it a day
          self.emit('job:end', job);
        }
        else {

          // Calling it a success
          self.emit('job:success', job);
          self.emit('job:end', job);
        }

        // Keeping last job
        self.lastJob = job;

        // Need to iterate
        var limit = self.options.limit || Infinity;

        if (!self.queue.length() && self.iterator && self.index < limit)
          iterate.call(self);

        return callback(err, job);
      });
    });

  }, this.options.concurrency || 1);

  // Pausing so that the queue starts processing only when we want it
  this.queue.pause();

  // Middlewares
  this.middlewares = {
    before: [],
    beforeScraping: [],
    afterScraping: []
  };

  // Built-in plugins
  this.use(stats());
}

// Inheriting
util.inherits(Spider, EventEmitter);

/**
 * Helpers
 */

// Creating a job object from a feed
function createJob(feed) {

  // Job skeleton
  var job = {
    id: 'Job[' + uuid.v4() + ']',
    original: feed,
    time: {
      start: 0,
      end: 0
    },
    state: {
      retrying: false,
      failing: false
    },
    req: {
      retries: 0,
      data: {}
    },
    res: {
      data: null
    }
  };

  // Handling polymorphism
  if (types.check(feed, 'string')) {
    job.req.url = feed;
    feed = {};
  }
  else {

    // Parsing url if needed
    if (feed.url)
      if (types.check(feed.url, 'object'))
        job.req.url = nodeUrl.format(extend(feed.url, {protocol: 'http'}));
      else
        job.req.url = feed.url;
    else
      job.req.url = nodeUrl.format(extend(feed, {protocol: 'http'}));
  }

  // Request properties
  job.req.data = feed.data || {};

  [
    'auth',
    'artoo',
    'body',
    'bodyType',
    'cookies',
    'headers',
    'method',
    'phantomPage',
    'timeout'
  ].forEach(function(p) {
    if (feed[p])
      job.req[p] = feed[p];
  });

  return job;
}

// Retrying a job
function retryJob(job, when) {
  when = when || 'later';

  // Reaching maxRetries?
  if (job.req.retries >= this.options.maxRetries)
    return;

  // Dropping from remains
  delete this.remains[job.id];

  // Request
  job.req.retries++;
  job.state.retrying = true;

  // Adding to the queue again
  this.queue[when === 'now' ? 'unshift' : 'push'](job);

  this.emit('job:retry', job, when);
}

// Applying beforeScraping middlewares
function beforeScraping(job, callback) {
  return async.applyEachSeries(
    this.middlewares.beforeScraping,
    job.req,
    callback
  );
}

// Using the engine to scrape
function scrape(job, callback) {
  return this.engine.fetch(job, callback);
}

// Applying afterScraping middlewares
function afterScraping(job, callback) {
  return async.applyEachSeries(
    this.middlewares.afterScraping,
    job.req, job.res,
    callback
  );
}

// Flattening remains
function flattenRemains() {
  return Object.keys(this.remains).map(function(k) {
    return this.remains[k];
  }, this);
}

// Perform an iteration
function iterate() {
  var lastJob = this.lastJob || {},
      feed = this.iterator.call(this, this.index, lastJob.req, lastJob.res);

  if (feed)
    this.addUrl(feed);
}

/**
 * Prototype
 */

// Starting the spider
Spider.prototype._start = function(callback) {
  var self = this;

  callback = callback || Function.prototype;

  // Safeguard
  if (!this.scraperScript)
    throw Error('sandcrawler.spider.start: no scraper was provided to this spider.');

  // Emitting
  this.state.running = true;
  this.emit('spider:start');

  // Initializing jar
  if (typeof this.options.jar === 'string') {
    fse.ensureFileSync(this.options.jar);
    this.jar = request.jar(new FileCookieStore(this.options.jar));
  }
  else if (typeof this.options.jar === 'object') {
    this.jar = this.options.jar;
  }
  else if (this.options.jar) {
    this.jar = request.jar();
  }

  // Resolving starting middlewares
  async.series(
    this.middlewares.before,
    function(err) {

      // Failing the spider if error occurred
      if (err) {
        return self.fail(err);
      }

      // Else, we simply resume the queue and wait for it to drain
      self.queue.drain = function() {

        // All processes finished, we call it a success
        var remains = flattenRemains.call(self);
        return self._succeed(remains);
      };

      // Starting iterator?
      var limit = self.options.limit || Infinity;
      if (!self.queue.length() && self.iterator && self.index < limit)
        iterate.call(self);

      // Resuming queue to start the jobs
      self.queue.resume();
    }
  );

  // Listening to success/fail events
  this.once('spider:fail', function(err, remains) {
    return callback(err, remains);
  });

  this.once('spider:success', function(remains) {
    return callback(null, remains);
  });
};

// Failing the spider
Spider.prototype._fail = function(err) {
  var remains = flattenRemains.call(this);

  this.emit('spider:fail', err, remains);
  this._end('fail', remains || []);
};

// Succeeding the spider
Spider.prototype._succeed = function() {
  var remains = flattenRemains.call(this);

  this.emit('spider:success', remains);
  this._end('success', remains || []);
};

// Ending the spider
Spider.prototype._end = function(status, remains) {

  // State
  this.state.running = false;
  this.state.fulfilled = true;

  // Tearing down
  this._teardown();

  // Emitting
  this.emit('spider:end', status, remains || []);
};

// Manually exiting the spide
Spider.prototype.exit = function() {
  this.queue.tasks.forEach(function(task) {
    var job = task.data;

    this.remains[job.id] = {
      error: helpers.serializeError(new Error('spider-exit')),
      job: job
    };
  }, this);

  this.queue.kill();
  this._fail(new Error('exited'));
};

// Teardown
Spider.prototype._teardown = function() {

  // Emitting
  this.emit('spider:teardown');

  // Ending jobStream
  this.queue.kill();

  // Listeners
  this.removeAllListeners();
};

// Adding a new url during runtime
Spider.prototype.url = function(feed) {

  if (!types.check(feed, 'feed') && !types.check(feed, ['feed']))
    throw Error('sandcrawler.spider.url(s): wrong argument.');

  // Don't add if already at limit
  if(this.options.limit && this.index >= this.options.limit)
    return this;

  (!(feed instanceof Array) ? [feed] : feed).forEach(function(item) {
    var job = createJob(item);

    this.queue.push(job);

    if (this.state.running)
      this.emit('job:add', job);
  }, this);

  return this;
};

// Aliases
Spider.prototype.urls = Spider.prototype.url;
Spider.prototype.addUrl = Spider.prototype.url;
Spider.prototype.addUrls = Spider.prototype.url;

// Iterating through a generator
Spider.prototype.iterate = function(fn) {

  if (typeof fn !== 'function')
    throw Error('sandcrawler.spider.iterate: iterator must be a function.');

  this.iterator = fn;
  return this;
};

// Loading the required scraper
Spider.prototype.scraper = function(fn, check) {

  // Checking
  if (typeof fn !== 'function')
    throw Error('sandcrawler.spider.scraper: argument must be a function.');

  this.scraperScript = (this.engine.compile || _.identity)(fn, check);
  this.synchronousScraperScript = false;

  return this;
};

// Loading an asynchronous scraper
Spider.prototype.scraperSync = function(fn, check) {

  // Checking
  if (typeof fn !== 'function')
    throw Error('sandcrawler.spider.scraper: argument must be a function.');

  this.scraperScript = (this.engine.compile || _.identity)(fn, check, true);
  this.synchronousScraperScript = true;

  return this;
};

// Computing results of a job
Spider.prototype.result = function(fn) {

  if (typeof fn !== 'function')
    throw Error('sandcrawler.spider.result: given argument is not a function.');

  this.on('job:fail', function(err, job) {
    fn.call(this, err, job.req, job.res);
  });

  this.on('job:success', function(job) {
    fn.call(this, null, job.req, job.res);
  });

  return this;
};

// Altering configuration
Spider.prototype.config = function(o) {

  if (!types.check(o, 'config'))
    throw Error('sandcrawler.spider.config: invalid configuration provided.');

  this.options = extend(o, this.options);

  // Updating queue's concurrency
  this.queue.concurrency = this.options.concurrency;
  return this;
};

// Updating timeout
Spider.prototype.timeout = function(t) {

  if (!types.check(t, 'number'))
    throw Error('sandcrawler.spider.timeout: wrong argument');

  this.options.timeout = t;

  return this;
};

// Updating limit
Spider.prototype.limit = function(l) {

  if (!types.check(l, 'number'))
    throw Error('sandcrawler.spider.limit: wrong argument');

  this.options.limit = l;

  // Applying limit on already existant queue
  this.queue.tasks = this.queue.tasks.slice(0, l);

  return this;
};

// Using a plugin
Spider.prototype.use = function(plugin) {

  if (typeof plugin !== 'function')
    throw Error('sandcrawler.spider.use: plugin must be a function.');

  plugin.call(this, this);
  return this;
};

// Shortcut for the built-in validate plugin
Spider.prototype.validate = function(definition) {
  return this.use(validate(definition));
};

// Shortcut for the built-in throttle plugin
Spider.prototype.throttle = function(min, max) {
  return this.use(throttle(min, max));
};

// Locking the spider
Spider.prototype._lock = function() {
  this.state.locked = true;
  return this.pause();
};

Spider.prototype._unlock = function() {
  this.state.locked = false;
  return this.resume();
};

// Pausing the spider
Spider.prototype.pause = function() {
  this.queue.pause();
  this.state.paused = true;
  return this;
};

// Resuming the spider
Spider.prototype.resume = function() {
  if (this.state.locked)
    return this;

  this.queue.resume();
  this.state.paused = false;
  return this;
};

// Registering middlewares
function middlewareRegister(type) {
  Spider.prototype[type] = function(fn) {

    // Guard
    if (typeof fn !== 'function')
      throw Error('sandcrawler.spider.' + type + ': given argument is not a function');

    this.middlewares[type].push(fn.bind(this));
    return this;
  };
}

middlewareRegister('before');
middlewareRegister('beforeScraping');
middlewareRegister('afterScraping');

/**
 * Exporting
 */
module.exports = Spider;
