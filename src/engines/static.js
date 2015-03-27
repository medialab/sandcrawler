/**
 * Sandcrawler Static Engine
 * ==========================
 *
 * Using request to retrieve given urls statically.
 */
var request = require('request'),
    artoo = require('artoo-js'),
    cheerio = require('cheerio'),
    iconv = require('iconv-lite'),
    extend = require('../helpers.js').extend,
    Cookie = require('tough-cookie').Cookie;

// Bootstrapping cheerio
artoo.bootstrap(cheerio);

/**
 * Main
 */
function StaticEngine(spider) {

  this.type = 'static';

  // Spider run method
  spider.run = function(callback) {
    if (this.state.running)
      throw Error('sandcrawler.spider.run: spider already running.');
    return spider._start(callback);
  };

  // Fetching method
  this.fetch = function(job, callback) {

    // Request settings
    var settings = {
      encoding: null,
      headers: extend(job.req.headers, spider.options.headers),
      method: job.req.method || spider.options.method,
      proxy: job.req.proxy || spider.options.proxy,
      timeout: job.req.timeout || spider.options.timeout,
      uri: job.req.url
    };

    if (job.req.auth || spider.options.auth)
      settings.auth = extend(job.req.auth, spider.options.auth);

    if (job.req.cookies || spider.options.cookies) {
      var pool = (job.req.cookies || []).concat(spider.options.cookies || []);

      var cookieString = pool.map(function(c) {
        if (typeof c === 'string')
          return c;
        else
          return (new Cookie(c)).cookieString();
      }).join('; ');

      settings.headers.Cookie = cookieString;
    }

    if (spider.jar)
      settings.jar = spider.jar;

    var bodyType = job.req.bodyType || spider.options.bodyType,
        body = typeof job.req.body === 'string' ?
          job.req.body :
          extend(job.req.body, spider.options.body);

    if (body) {
      if (bodyType === 'json') {
        if (typeof body === 'string') {
          settings.body = body;
          settings.headers['Content-Type'] = 'application/json';
        }
        else {
          settings.json = true;
          settings.body = body;
        }
      }
      else {
        settings.form = body;
      }
    }

    request(settings, function(err, response, body) {

      // If an error occurred
      if (err) {
        if (err.message === 'ETIMEDOUT')
          return callback(new Error('timeout'));
        if (~err.message.search(/getaddrinfo/))
          return callback(new Error('host-not-found'));
        return callback(err);
      }

      // Overloading
      job.res.url = response.request.href;
      job.res.body = body;
      job.res.status = response.statusCode;
      job.res.headers = response.caseless.dict;

      // Assessing some things
      var json = /json/.test(job.res.headers['content-type']);

      // Handling encoding
      var sourceEncoding = job.req.encoding || spider.options.encoding;

      if (sourceEncoding === false) {

        // Applying some heuristics

        //-- 1) Content type header
        var contentType = job.res.headers['content-type'];

        if (contentType)
          sourceEncoding = contentType.split('charset=')[1] || false;

        //-- 2) HTTP equivalent or meta charset
        if (!sourceEncoding && !json) {
          var m = body.match(/<meta.*?charset=([^"']+)/);
          sourceEncoding = m && m[1];
        }

        // Fallback
        if (!sourceEncoding)
          sourceEncoding = 'utf-8';
      }

      if (sourceEncoding) {
        try {
          job.res.body = iconv.decode(new Buffer(body), sourceEncoding);
        }
        catch (e) {
          return callback(new Error('encoding-error'));
        }
      }

      // Status error
      if (response.statusCode >= 400) {
        var error = new Error('status-' + (response.statusCode || 'unknown'));
        error.status = response.statusCode;
        return callback(error);
      }

      // JSON?
      if (json) {
        try {
          job.res.body = JSON.parse(job.res.body);
          return callback(null, job);
        }
        catch (e) {}
      }

      // Parsing
      if (spider.scraperScript) {
        var $ = cheerio.load(
          job.res.body,
          job.cheerio || spider.options.cheerio || {}
        );

        if (spider.synchronousScraperScript) {
          try {
            job.res.data = spider.scraperScript.call(spider, $, job);
          }
          catch (e) {
            return callback(e);
          }

          return callback(null, job);
        }
        else {
          try {
            spider.scraperScript.call(spider, $, function(err, data) {
              job.res.data = data;
              return callback(err, data);
            }, job);
          }
          catch (e) {
            return callback(e);
          }
        }
      }
      else {
        return callback(null, job);
      }
    });
  };
}

/**
 * Exporting
 */
module.exports = StaticEngine;
