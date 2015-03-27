/**
 * Sandcrawler Phantom Engine
 * ===========================
 *
 * Using a phantomjs child to scrape the given pages.
 */
var extend = require('../helpers.js').extend,
    errors = require('../../errors.json').phantom,
    async = require('async'),
    spawn = require('../spawn.js'),
    types = require('../typology.js'),
    phscript = require('../phantom_script.js'),
    helpers = require('../helpers.js'),
    qs = require('querystring'),
    Cookie = require('tough-cookie').Cookie,
    Spawn = require('../spawn.js').abstract,
    nodeUrl = require('url'),
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

    if (phantom instanceof Spawn) {
      return phantom.run(spider, callback);
    }
    else if (types.check(phantom, 'object')) {
      return spawn(phantom, function(err, defaultSpawn) {
        if (err)
          return callback(err);

        defaultSpawn.run(spider, callback);
      });
    }
    else {
      return spawn(function(err, defaultSpawn) {
        if (err)
          return callback(err);

        defaultSpawn.run(spider, callback);
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
    self.phantom.socket.setMaxListeners(20);

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

    // Authentication
    if (auth.user)
      headers.Authorization = 'Basic ' + btoa(auth.user + (auth.password ? ':' + auth.password : ''));

    // Request body
    var body = null;
    if (job.req.body || spider.options.body) {
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

    // Request cookies
    var cookies;
    if (job.req.cookies || spider.options.cookies) {
      var pool = (job.req.cookies || []).concat(spider.options.cookies || []),
          purl = nodeUrl.parse(job.req.url);

      cookies = pool
        .map(function(c) {
          var cookie;

          if (typeof c === 'string')
            cookie = Cookie.parse(c);
          else
            cookie = new Cookie(c);

          cookie.domain = cookie.domain || purl.hostname;
          cookie.path = cookie.path || '/';

          return cookie;
        })
        .map(helpers.serializeCookie);
    }
    else if (spider.jar) {
      cookies = spider.jar.getCookies(job.req.url).map(helpers.serializeCookie);
    }

    // Unleash the phantom
    var call = self.phantom.request(

      // We ask the phantom child to scrape
      'scrape',

      // Sent data
      {
        artoo: extend(job.req.artoo, spider.options.artoo),
        body: body,
        cookies: cookies,
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

        // Setting job's response
        job.res = _.pick(response, [
          'body',
          'data',
          'url',
          'status',
          'headers'
        ]);

        if (err)
          return callback(err, job);

        // Dealing with cookies
        var header = (job.res.headers || {})['set-cookie'];

        if (spider.jar && header)
          header.split('\n').forEach(function(str) {
            spider.jar.setCookie(str, job.res.url);
          });

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

    self.requests.push({
      call: call,
      job: job
    });
  };
}

/**
 * Exporting
 */
module.exports = PhantomEngine;
