/**
 * Sandcrawler Task Class
 * =======================
 *
 * A task instance is returned when a crawler starts to feed on a url list.
 * It provides the user with useful chainable utilities and a hand on the final
 * outcome.
 */
var async = require('async'),
    types = require('typology'),
    helpers = require('../helpers.js'),
    config = require('../../config.json'),
    EventEmitter = require('events').EventEmitter,
    util = require('util'),
    uuid = require('uuid'),
    fs = require('fs'),
    _ = require('lodash');

// Abstract class
function Task(spy) {
  var self = this;

  // Extending event emitter
  EventEmitter.call(this);

  // Properties
  this.spy = spy;
  this.scraper = null;
  this.id = 'Task[' + uuid.v4() + ']';
  this.settings = config;

  // Callbacks
  this.callbacks = {
    validate: []
  };

  // Spy Listeners
  this.spy.messenger.on('page:log', function(msg) {
    if (msg.taskId !== self.id)
      return;

    self.emit('page:log', msg.url, msg.data.message);
  });

  this.spy.messenger.on('page:error', function(msg) {
    if (msg.taskId !== self.id)
      return;

    self.emit('page:error', msg.url, msg.data.message);
  });

  // Event listeners
  this.on('task:end', function() {
    this.emit('task:over', true);
  });

  this.on('task:fail', function() {
    this.emit('task:over', false);
  });

  this.on('page:validate', function(page) {

    // As a normal rule, we do not validate the received data
    if (this.callbacks.validate.length)
      async.applyEachSeries(this.callbacks.validate, page, function(err) {
        if (err)
          return self.emit('page:fail', err);

        self.emit('page:process', page);
      });
    else
      this.emit('page:process', page);
  });

  this.on('page:scrape', function(feed) {

    // Asking the phantom child to scrape the given page
    this.spy.messenger.request(

      // We want to scrape
      'scrape',

      // Sent data
      {
        id: this.id,
        url: feed,
        scraper: this.scraper,
        timeout: this.settings.timeout
      },

      // Request parameters
      {timeout: this.settings.timeout},

      // Callback
      function(err, page) {
        if (err)
          return self.emit('page:fail', new Error('timeout'));

        self.emit('page:validate', _.omit(page, 'taskId'));
      }
    );
  });
}

util.inherits(Task, EventEmitter);

// Prototype
Task.prototype.inject = function(scraper) {
  if (this.scraper)
    throw 'sandcrawler.task.inject: scraper already defined.';

  if (!types.check(scraper, 'string|function'))
    throw 'sandcrawler.task.inject: wrong argument (must be function or string).';

  // Closure
  this.scraper = helpers.wrapForPhantom(scraper);

  // Launching
  this.emit('task:start');

  return this;
};

Task.prototype.injectScript = function(scraperPath) {
  var scraper = fs.readFileSync(scraperPath, 'utf-8');

  this.scraper = helpers.wrapForPhantom(scraper);

  // Launching
  this.emit('task:start');

  return this;
};

Task.prototype.config = function(o) {
  this.settings = helpers.extend(o, this.settings);
  return this;
};

Task.prototype.validate = function(spec) {
  if (!types.check(spec, 'function|object|array|string'))
    throw Error('sandcrawler.task.validate: wrong argument.');

  this.callbacks.validate.push(function(page, next) {
    var valid;

    if (typeof spec === 'function')
      valid = spec.call(this, page.data);
    else
      valid = types.check(page.data, spec);

    return next(valid ? null : new Error('invalid-data'));
  });

  return this;
};

Task.prototype.process = function(fn) {
  this.on('page:process', function(page) {
    fn.call(this, null, page);
  });
  this.on('page:fail', function(err) {
    fn.call(this, err);
  });
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
