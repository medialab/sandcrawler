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
  this.settings = config;

  // Spy Listeners
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

  // Event listeners
  this.on('task:scrape', function(feed) {

    // Asking the phantom child to scrape the given page
    this.spy.messenger
      .request(
        'scrape',
        {
          id: this.id,
          url: this.url,
          scraper: this.scraper,
          timeout: this.settings.timeout
        },
        {timeout: this.settings.timeout}
      )
      .then(function(response) {
        self.emit('task:process', response.data);
      })
      .fail(function(err) {
        self.emit('task:fail', {err: err});
      });
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
