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
    util = require('util'),
    uuid = require('uuid');

function Task(spy, feed) {
  var self = this;

  // Extending event emitter
  EventEmitter.call(this);

  // Properties
  this.spy = spy;
  this.feed = feed;
  this.scraper = null;
  this.timeout = null;
  this.id = 'Task[' + uuid.v4() + ']';

  // Listeners
  this.spy.messenger.on('page:log', function(data) {
    if (data.taskId !== self.id)
      return;

    self.emit('page:log', data);
  });

  this.spy.messenger.on('page:error', function(data) {
    if (data.taskId !== self.id)
      return;

    self.emit('page:error', data);
  });

  // Methods
  this.start = function() {
    var timeout = this.timeout || config.timeout;

    // Notifying the phantom child
    this.spy.messenger
      .request(
        'scrape',
        {
          id: this.id,
          url: this.feed,
          scraper: this.scraper,
          timeout: timeout
        },
        {timeout: timeout}
      )
      .then(function(response) {
        self.emit('task:process', response.data);
        self.emit('task:end', response.data);
      })
      .fail(function(err) {
        self.emit('task:fail', {err: err});
      });
  };
}

util.inherits(Task, EventEmitter);

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

// TODO: injectSync

Task.prototype.progress = function(fn) {
  this.on('task:progress', fn);
  return this;
};

Task.prototype.then = function(fn) {
  this.on('task:end', fn);
  return this;
};

Task.prototype.fail = function(fn) {
  this.on('task:fail', fn);
  return this;
};

module.exports = Task;
