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
    types = require('typology'),
    util = require('util'),
    uuid = require('uuid'),
    async = require('async'),
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

            // TODO: autoretry when polymorphism
            retryJob.call(self, job);
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
    after: [],
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
    state: {
      retrying: false,
      failing: false
    },
    req: {
      retries: 0,
      data: {},
      params: {}
    },
    res: {}
  };

  // Handling polymorphism
  if (types.get(feed) === 'string') {
    job.req.url = feed;
  }
  else {

    // Safeguard
    if (!feed.url)
      throw Error('sandcrawler.spider.url(s)/addUrl(s): no url provided.');

    job.req.url = feed.url;
    job.req.data = feed.data || {};
    job.req.params = feed.params || {};

    if (feed.timeout)
      job.req.timeout = feed.timeout;
  }

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
Spider.prototype.start = function(callback) {
  var self = this;

  // Safeguard
  if (!this.scraperScript)
    throw Error('sandcrawler.spider.start: no scraper was provided to this spider.');

  // Emitting
  this.emit('spider:start');

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
        return self.succeed(remains);
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

// TODO: run method
Spider.prototype.run = function(callback) {
  this.start(callback);
};

// Failing the spider
Spider.prototype.fail = function(err) {
  var remains = flattenRemains.call(this);

  this.emit('spider:fail', err, remains);
  this.end('fail', remains || []);
};

// Succeeding the spider
Spider.prototype.succeed = function() {
  var remains = flattenRemains.call(this);

  this.emit('spider:success', remains);
  this.end('success', remains || []);
};

// Ending the spider
Spider.prototype.end = function(status, remains) {

  // Emitting
  this.emit('spider:end', status, remains || []);

  // TODO: Resolving ending middlewares

  this.state.running = false;
  this.state.fulfilled = true;

  // Tearing down
  this.teardown();
};

// Teardown
Spider.prototype.teardown = function() {

  // Emitting
  this.emit('spider:teardown');

  // Ending jobStream
  this.queue.kill();

  // Listeners
  this.removeAllListeners();
};

// Assigning a single url
Spider.prototype.url = function(feed) {

  // TODO: more precise type checking
  if (!types.check(feed, 'string|array|object'))
    throw Error('sandcrawler.spider.url(s): wrong argument.');

  // Don't add if already at limit
  if(this.options.limit && this.index >= this.options.limit)
    return this;

  (!(feed instanceof Array) ? [feed] : feed).forEach(function(item) {
    this.queue.push(createJob(item));
  }, this);

  return this;
};

// Adding a new url during runtime
Spider.prototype.addUrl = function(feed) {

  // TODO: more precise type checking
  if (!types.check(feed, 'string|array|object'))
    throw Error('sandcrawler.spider.url(s): wrong argument.');

  // Don't add if already at limit
  if(this.options.limit && this.index >= this.options.limit)
    return this;

  (!(feed instanceof Array) ? [feed] : feed).forEach(function(item) {
    var job = createJob(item);

    this.queue.push(job);
    this.emit('job:add', job);
  }, this);

  return this;
};

// Aliases
Spider.prototype.urls = Spider.prototype.url;
Spider.prototype.addUrls = Spider.prototype.addUrl;

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

  if (!types.check(o, 'object'))
    throw Error('sandcrawler.spider.config: wrong argument.');

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

// Pausing the spider
Spider.prototype.pause = function() {
  this.queue.pause();
  return this;
};

// Resuming the spider
Spider.prototype.resume = function() {
  this.queue.resume();
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
middlewareRegister('after');
middlewareRegister('beforeScraping');
middlewareRegister('afterScraping');

/**
 * Exporting
 */
module.exports = Spider;
