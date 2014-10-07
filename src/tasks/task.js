/**
 * Sandcrawler Task Class
 * =======================
 *
 * A task instance is returned when a crawler starts to feed on a url list.
 * It provides the user with useful chainable utilities and a hand on the final
 * outcome.
 */
var types = require('typology'),
    helpers = require('../helpers.js'),
    config = require('../../config.json'),
    EventEmitter = require('events').EventEmitter,
    util = require('util'),
    uuid = require('uuid'),
    fs = require('fs');

// Abstract class
function Task(spy) {
  var self = this;

  // Extending event emitter
  EventEmitter.call(this);

  // Properties
  this.spy = spy;
  this.scraper = null;
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
}

util.inherits(Task, EventEmitter);

// Prototype
Task.prototype.inject = function(scraper) {
  if (this.scraper)
    throw 'sandcrawler.inject: scraper already defined.';

  if (!types.check(scraper, 'string|function'))
    throw 'sandcrawler.inject: wrong argument (must be function or string).';

  // Closure
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
