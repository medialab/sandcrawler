/**
 * Sandcrawler Phantom Engine
 * ===========================
 *
 * Using a phantomjs child to scrape the given pages.
 */
var extend = require('../helpers.js').extend,
    spawn = require('../spawn.js'),
    types = require('../typology.js'),
    phscript = require('../phantom_script.js'),
    _ = require('lodash');

/**
 * Main
 */
function PhantomEngine(spider) {
  var self = this;

  // Properties
  this.type = 'phantom';
  this.phantom = null;
  this.requests = [];

  // Helpers
  function getJob(msg) {
    if (msg.from !== self.phantom.name)
        return;

    var request = _.find(self.requests, function(req) {
      return msg.body.callId === req.call.id;
    });

    return request ? request.job : undefined;
  }

  // Spider run method
  spider.run = function(phantom, callback) {
    if (typeof phantom === 'function') {
      callback = phantom;
      phantom = null;
    }

    if (phantom) {
      if (!types.check(phantom, 'object'))
        throw Error('sandcrawler.spider.engines.phantom: trying to run spider with a non-phantom.');

      self.phantom = phantom;
      spider._start(callback);
    }
    else {
      spawn(function(err, defaultSpawn) {
        if (err)
          return callback(err);

        self.phantom = defaultSpawn.spy;
        spider._start(callback);
      });
    }
  };

  // Listeners
  this.listeners = {
    crash: function() {

      // Removing queue drain
      // TODO: there must be more elegant ways to perform this...
      spider.queue.drain = null;

      self.requests.forEach(function(req) {
        req.call.cancel();
      });

      spider._fail(new Error('phantom-crash'));
    },
    log: function(msg) {
      var job = getJob(msg);

      if (job)
        spider.emit('page:log', msg.body.data, job.req, job.res);
    },
    error: function(msg) {
      var job = getJob(msg);

      if (job)
        spider.emit('page:error', msg.body.data, job.req, job.res);
    },
    alert: function(msg) {
      var job = getJob(msg);

      if (job)
        spider.emit('page:alert', msg.body.data, job.req, job.res);
    }
  };

  // Listening
  spider.once('spider:start', function() {
    self.phantom.once('crash', self.listeners.crash);
    self.phantom.on('page:log', self.listeners.log);
    self.phantom.on('page:error', self.listeners.error);
    self.phantom.on('page:alert', self.listeners.alert);
  });

  // On teardown
  spider.once('spider:teardown', function() {
    self.phantom.removeListener('crash', self.listeners.crash);
    self.phantom.removeListener('page:log', self.listeners.log);
    self.phantom.removeListener('page:error', self.listeners.error);
    self.phantom.removeListener('page:alert', self.listeners.alert);
  });

  // Compiling method
  this.compile = function(fn, check, synchronous) {
    return phscript.fromFunction(fn, check, synchronous);
  };

  // Fetching method
  this.fetch = function(job, callback) {

    // Figuring timeout
    var timeout = job.req.timeout || spider.options.timeout;

    var call = this.phantom.request(

      // We ask the phantom child to scrape
      'scrape',

      // Sent data
      {
        url: job.req.url,
        synchronousScript: spider.synchronousScraperScript,
        script: spider.scraperScript,
        params: extend(spider.options.params, job.req.params),
        timeout: timeout
      },

      // Request timeout
      {timeout: timeout},

      // Callback
      function(err, msg) {
        var response = (msg || {}).body || {},
            betterError;

        // Resolving call
        self.requests = _.remove(self.requests, function(req) {
          return req.call === call;
        });

        // Populating response
        job.res = response;

        if (err)
          return callback(err, job);

        // Phantom failure
        if (response.fail && response.reason === 'fail') {
          betterError = new Error('phantom-fail');
          betterError.code = response.error.errorCode;
          betterError.reason = response.error.errorString;
          return callback(betterError, job);
        }

        // Wrong status code
        if (response.fail && response.reason === 'status') {
          betterError = new Error('status-' + (response.status || 'unknown'));
          betterError.status = response.status;
          return callback(betterError, job);
        }

        // User-generated error
        if (response.error) {
          betterError = new Error(response.error.message);

          for (var k in _.omit(response.error, 'message'))
            betterError[k] = response.error[k];
          return callback(betterError, job);
        }

        return callback(null, job);
      }
    );

    this.requests.push({
      call: call,
      job: job
    });
  };
}

/**
 * Exporting
 */
module.exports = PhantomEngine;
