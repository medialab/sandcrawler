/**
 * Sandcrawler Phantom Engine
 * ===========================
 *
 * Using a phantomjs child to scrape the given pages.
 */
var extend = require('../helpers.js').extend,
    errors = require('../../errors.json').phantom,
    spawn = require('../spawn.js'),
    types = require('../typology.js'),
    phscript = require('../phantom_script.js'),
    qs = require('querystring'),
    _ = require('lodash');

/**
 * Helper
 */
function btoa(str) {
  return (new Buffer(str, 'binary')).toString('base64');
}

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
    if (!msg.id && msg.from !== self.phantom.name)
        return;

    var request = _.find(self.requests, function(req) {
      return msg.body.callId === req.call.id;
    });

    return request ? request.job : undefined;
  }

  // Spider run method
  spider.run = function(phantom, callback) {
    if (this.state.running)
      throw Error('sandcrawler.spider.run: spider already running.');

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

  // Inline script loading
  spider.inlineScraper = function(str, check) {
    this.scraperScript = phscript.fromString(str, check, false);
    this.synchronousScraperScript = false;
    return this;
  };

  spider.inlineScraperSync = function(str) {
    this.scraperScript = phscript.fromString(str, false, true);
    this.synchronousScraperScript = true;
    return this;
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
    },
    navigation: function(msg) {
      var job = getJob(msg);

      if (!job)
        return;

      // Creating navigation object
      var navigation = extend(
        msg.body.data,
        {
          replyWithScraper: function(scraper) {
            var compiled = self.compile(scraper, false);

            // Replying
            self.phantom.replyTo(msg.id, compiled);
          }
        }
      );

      // Emitting
      spider.emit('page:navigation', navigation, job.req, job.res);
    }
  };

  // Listening
  spider.once('spider:start', function() {
    self.phantom.once('crash', self.listeners.crash);
    self.phantom.on('page:log', self.listeners.log);
    self.phantom.on('page:error', self.listeners.error);
    self.phantom.on('page:alert', self.listeners.alert);
    self.phantom.on('page:navigation', self.listeners.navigation);
  });

  // On teardown
  spider.once('spider:teardown', function() {
    self.phantom.removeListener('crash', self.listeners.crash);
    self.phantom.removeListener('page:log', self.listeners.log);
    self.phantom.removeListener('page:error', self.listeners.error);
    self.phantom.removeListener('page:alert', self.listeners.alert);
    self.phantom.removeListener('page:navigation', self.listeners.navigation);
  });

  // Compiling method
  this.compile = function(fn, check, synchronous) {
    return phscript.fromFunction(fn, check, synchronous);
  };

  // Fetching method
  this.fetch = function(job, callback) {

    // Figuring timeout
    var timeout = job.req.timeout || spider.options.timeout;

    // Headers (because of phantom lack of http auth)
    var headers = extend(job.req.headers, spider.options.headers),
        auth = extend(job.req.auth, spider.options.auth);

    if (auth.user)
      headers.Authorization = 'Basic ' + btoa(auth.user + (auth.password ? ':' + auth.password : ''));

    var body = null;
    if (job.req.body || spider.options.body) {
      var type = job.req.bodyType || spider.options.bodyType;

      body = typeof job.req.body === 'string' ?
        job.req.body :
        extend(job.req.body, spider.options.body);

      if (type === 'json') {
        headers['Content-Type'] = 'application/json';
        body = typeof body === 'string' ?
          body :
          JSON.stringify(body);
      }
      else {
        headers['Content-Type'] = 'application/x-www-form-urlencoded';
        body = typeof body === 'string' ?
          body :
          qs.stringify(body);
      }
    }

    var call = this.phantom.request(

      // We ask the phantom child to scrape
      'scrape',

      // Sent data
      {
        artoo: extend(job.req.artoo, spider.options.artoo),
        body: body,
        headers: headers,
        page: extend(job.req.phantomPage, spider.options.phantomPage),
        url: job.req.url,
        method: job.req.method || spider.options.method,
        synchronousScript: spider.synchronousScraperScript,
        script: spider.scraperScript,
        timeout: timeout,
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
        if (response.headers) {
          var headers = {};
          response.headers.forEach(function(h) {
            headers[h.name.toLowerCase()] = h.value;
          });
          response.headers = headers;
        }

        job.res = response;

        if (err)
          return callback(err, job);

        // Phantom failure
        if (response.fail && response.reason === 'fail') {
          betterError = new Error(errors[response.error.errorCode] || 'phantom-fail');
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
