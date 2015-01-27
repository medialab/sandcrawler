/**
 * Sandcrawler Scraper Abstraction
 * ================================
 *
 * Abstract scraper definition on which one should should mount an precise
 * engine to actually work.
 *
 * The intention here is to clearly separate the scraper's logic from its means.
 */
var EventEmitter = require('events').EventEmitter,
    types = require('typology'),
    util = require('util'),
    uuid = require('uuid'),
    _ = require('highland');

/**
 * Main
 */
function Scraper(name, engine) {
  var self = this;

  // Safeguard
  if (!(this instanceof Scraper))
    return new Scraper(name, engine);

  // Events
  EventEmitter.call(this);

  // Assigning a unique identifer
  this.id = 'Scraper[' + uuid.v4() + ']';
  this.name = name || this.id.substr(0, 16) + ']';

  // Properties
  this.engine = new engine(this);
  this.state = {
    fulfilled: false,
    locked: false,
    paused: false,
    running: false
  };

  // Plumbing
  this.jobStream = _([]);
  this.pipeline = function(stream) {
    return stream
      .flatMap(beforeScraping(self))
      .flatMap(scraping(self));
  };

  // Middlewares
  this.middlewares = {
    before: [],
    after: [],
    beforeScraping: [],
    afterScraping: []
  };
}

// Inheriting
util.inherits(Scraper, EventEmitter);

/**
 * Helpers
 */

// Creating a job object from a feed
function createJob(feed, idx) {

  // Job skeleton
  var job = {
    id: 'Job[' + uuid.v4() + ']',
    original: feed,
    state: {},
    req: {
      index: idx,
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
      throw Error('sandcrawler.scraper.url(s)/addUrl(s): no url provided.');

    job.req.url = feed.url;
    job.req.data = feed.data || {};
    job.req.params = feed.params || {};

    if (feed.timeout)
      job.req.timeout = feed.timeout;
  }

  return job;
}

// Before scraping
function beforeScraping(scraper) {
  return _.wrapCallback(function(job, callback) {
    _(scraper.middlewares.beforeScraping)
        .nfcall([job])
        .series()
        .stopOnError(function(err) {
          callback(err);
        })
        .apply(function() {
          callback(null, job);
        });
  });
}

// Scraping
function scraping(scraper) {
  return _.wrapCallback(function(job, callback) {
    scraper.engine.fetch(job, callback);
  });
}

/**
 * Prototype
 */

// Starting the scraper
Scraper.prototype.run = function(callback) {
  var self = this;

  // Emitting
  this.emit('scraper:start');

  // Resolving starting middlewares
  _(this.middlewares.before)
    .nfcall()
    .series()
    .stopOnError(function(err) {

      // Error occurred
      self.fail(err);
      callback(err);
    })
    .apply(function() {

      // TODO: Parallel
      // TODO: Errors

      // Passing jobs through the pipeline
      self.jobStream
        .through(self.pipeline)
        .toArray(function() {
// console.log(arguments[0])
          // Exiting the scraper
          self.succeed();
          callback(null);
        });
    });
};

// Failing the scraper
Scraper.prototype.fail = function(err) {
  this.emit('scraper:fail', err);
  this.exit('fail');
};

// Succeeding the scraper
Scraper.prototype.succeed = function() {
  this.emit('scraper:success');
  this.exit('success');
};

// Exiting the scraper
Scraper.prototype.exit = function(status) {

  // Emitting
  this.emit('scraper:end', status);

  // TODO: Resolving ending middlewares

  this.state.running = false;
  this.state.fulfilled = true;

  // Tearing down
  this.teardown();
};

// Teardown
Scraper.prototype.teardown = function() {

  // Ending jobStream
  this.jobStream.destroy();

  // Listeners
  this.removeAllListeners();
};

// Assigning a single url
Scraper.prototype.url = function(feed) {

  // TODO: more precise type checking
  if (!types.check(feed, 'string|array|object'))
    throw Error('sandcrawler.scraper.url(s): wrong argument.');

  (!(feed instanceof Array) ? [feed] : feed).forEach(function(item) {
    this.jobStream = this.jobStream.append(createJob(item));
  }, this);

  return this;
};

// Adding a new url during runtime
Scraper.prototype.addUrl = function(feed) {

  // TODO: more precise type checking
  if (!types.check(feed, 'string|array|object'))
    throw Error('sandcrawler.scraper.url(s): wrong argument.');

  (!(feed instanceof Array) ? [feed] : feed).forEach(function(item) {
    this.jobStream = this.jobStream.append(createJob(item));
  }, this);

  this.emit('job:added');

  return this;
};

// Aliases
Scraper.prototype.urls = Scraper.prototype.url;
Scraper.prototype.addUrls = Scraper.prototype.addUrl;

// Iterating through a generator
Scraper.prototype.iterate = function(fn) {

  // Concat streams at start
};

// Computing results of a job
Scraper.prototype.result = function(fn) {

  if (typeof fn !== 'function')
    throw Error('sandcrawler.scraper.result: given argument is not a function.');

  this.on('job:fail', function(err, job) {
    fn.call(this, err, job.req, job.res);
  });

  this.on('job:success', function(job) {
    fn.call(this, null, job.req, job.res);
  });

  return this;
};

// Registering middlewares
function middlewareRegister(prototype, type) {
  prototype[type] = function(fn) {

    // Guard
    if (typeof fn !== 'function')
      throw Error('sandcrawler.scraper.' + type + ': given argument is not a function');

    this.middlewares[type].push(fn);
  };
}

middlewareRegister('before');
middlewareRegister('after');
middlewareRegister('beforeScraping');
middlewareRegister('afterScraping');

/**
 * Exporting
 */
module.exports = Scraper;
