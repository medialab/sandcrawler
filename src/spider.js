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
    phscript = require('./phantom_script.js'),
    extend = require('./helpers.js').extend,
    defaults = require('../defaults.json').spider;

/**
 * Main
 */
function Spider(name) {
  var self = this;

  // Events
  EventEmitter.call(this);

  // Assigning a unique identifer
  this.id = 'Spider[' + uuid.v4() + ']';
  this.name = name || this.id.substr(0, 16) + ']';

  // Properties
  this.options = extend(defaults);
  this.engine = null;
  this.type = null;
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
  this.iterator = null;
  this.scriptStack = null;
  this.parser = Function.prototype;

  // Queue
  this.queue = async.queue(function(job, callback) {
    self.index++;

    // Processing one job through the pipe
    return async.applyEachSeries([
      beforeScraping.bind(self),
      scrape.bind(self),
      afterScraping.bind(self)
    ], job, function(err) {

      if (err) {
        job.res.error = err;

        // Retry?
        job.req.retry = retryJob.bind(self, job);
        job.req.retryLater = job.req.retry;
        job.req.retryNow = retryJob.bind(self, job, 'later');

        // Updating remains
        self.remains[job.id] = {
          error: err,
          job: job
        };

        // Failing the job
        self.emit('job:fail', err, job);
      }
      else {

        // Calling it a success
        self.emit('job:success', job);
      }

      // Keeping last job
      self.lastJob = job;

      // Need to iterate
      var limit = self.options.limit || Infinity;
      if (!self.queue.length() && self.iterator && self.index < limit)
        iterate.call(self);

      return callback(err, job);
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

  // Dropping from remains
  delete this.remains[job.id];

  // Request
  job.req.retries++;

  // Adding to the queue again
  this.queue[when === 'now' ? 'unshift' : 'push'](job);
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
Spider.prototype.run = function(callback) {
  var self = this;

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
        callback(null, remains);
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
};

// Failing the spider
Spider.prototype.fail = function(err, remains) {
  this.emit('spider:fail', err);
  this.exit('fail', remains);
};

// Succeeding the spider
Spider.prototype.succeed = function(remains) {
  this.emit('spider:success');
  this.exit('success', remains);
};

// Exiting the spider
Spider.prototype.exit = function(status, remains) {

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
    this.queue.push(createJob(item));
  }, this);

  this.emit('job:added');

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

// Loading the scraping script
Spider.prototype.script = function(path, check) {
  if (this.scriptStack)
    throw Error('sandcrawler.spider.script: script already registered.');

  this.scriptStack = phscript.fromFile(path, check);
  return this;
};

// Loading some jawascript
Spider.prototype.jawascript = function(fn, check) {
  if (this.scriptStack)
    throw Error('sandcrawler.spider.jawascript: script already registered.');

  if (typeof fn === 'function')
    this.scriptStack = phscript.fromFunction(fn, check);
  else if (typeof fn === 'string')
    this.scriptStack = phscript.fromString(fn, check);
  else
    throw Error('sandcrawler.spider.jawascript: wrong argument.');

  return this;
};

// Parser used by static scenarios
Spider.prototype.parse = function(fn) {

  if (typeof fn !== 'function')
    throw Error('sandcrawler.spider.parse: given argument is not a function.');

  this.parser = fn;

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

// Registering middlewares
function middlewareRegister(type) {
  Spider.prototype[type] = function(fn) {

    // Guard
    if (typeof fn !== 'function')
      throw Error('sandcrawler.spider.' + type + ': given argument is not a function');

    this.middlewares[type].push(fn);
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
