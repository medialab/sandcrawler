/**
 * Sandcrawler Task Class
 * =======================
 *
 * A task instance is returned when a crawler starts to feed on a url list.
 * It provides the user with useful chainable utilities and a hand on the final
 * outcome.
 */
var types = require('typology'),
    helpers = require('./helpers.js'),
    config = require('../config.json'),
    EventEmitter = require('events').EventEmitter,
    util = require('util');

function Task(spy, feed) {
  var self = this;

  // Extending event emitter
  EventEmitter.call(this);

  // Properties
  this.spy = spy;
  this.feed = feed;
  this.scraper = null;
  this.timeout = null;

  // Callbacks
  this.onProgress = null;
  this.onEnd = null;

  // Methods
  this.start = function() {
    this.spy.messenger
      .request(
        'scrape',
        {url: this.feed, scraper: this.scraper},
        {timeout: this.timeout || config.timeout}
      )
      .then(function(data) {
        if (typeof self.onProgress === 'function') {

          // TODO: add arguments to callback
          self.onProgress(data);
        }

        // TODO: temp, move elsewhere
        if (typeof self.onEnd === 'function') {

          // TODO: add arguments to callback
          self.onEnd(data);
        }
      });
  };
}

util.inherits(EventEmitter, Task);

// Prototype
Task.prototype.inject = function(scraper) {
  if (this.scraper)
    throw 'sandcrawler.inject: scraper already defined.';

  if (!types.check(scraper, 'string|function'))
    throw 'sandcrawler.inject: wrong argument (must be function or string).';

  // Closure
  if (typeof scraper === 'function')
    this.scraper = helpers.wrapForPhantom(scraper);

  // Launching
  this.start();

  return this;
};

Task.prototype.progress = function(fn) {
  this.onProgress = fn;
};

Task.prototype.then = function(fn) {
  this.onEnd = fn;
};

module.exports = Task;
