/**
 * Sandcrawler Spawn
 * ==================
 *
 * Sandcrawler abstract wrapper around a custom phantom child process.
 */
var bothan = require('bothan'),
    uuid = require('uuid'),
    types = require('./typology.js'),
    PhantomEngine = require('./engines/phantom.js'),
    _ = require('lodash');

/**
 * Main
 */
function Spawn(params, anonym) {

  // Properties
  this.id = 'Spawn[' + uuid.v4() + ']';
  this.params = params;
  this.spy = null;
  this.closed = false;

  // Hidden properties
  this.scrapers = [];
}

/**
 * Prototype
 */

// Starting the child phantom
Spawn.prototype.start = function(callback) {
  var self = this;

  bothan.deploy(this.params, function(err, spy) {
    if (err)
      return callback(err);

    self.spy = spy;

    // Binding
    self.on = self.spy.on.bind(self.spy);

    // DEBUG: remove this asap
    self.on('error', function() {
      console.log('SANDCRAWLER:PHANTOM:DEBUG:ERROR', arguments);
    });
    self.on('log', function() {
      console.log('SANDCRAWLER:PHANTOM:DEBUG:LOG', arguments[0]);
    });

    callback();
  });
};

// Stopping the child phantom
Spawn.prototype.close = function() {
  if (this.closed)
    throw Error('sandcrawler.spawn.close: spawn already closed.');

  this.closed = true;

  this.spy.kill();

  return this;
};

// Running the given scraper
Spawn.prototype.run = function(scraper, callback) {
  var self = this;

  if (!types.check(scraper, 'scraper'))
    throw Error('sandcrawler.spawn.run: given argument is not a valid scraper.');

  if (scraper.state.fulfilled)
    throw Error('sandcrawler.spawn.run: given scraper has already been fulfilled.');

  if (scraper.state.running)
    throw Error('sandcrawler.spawn.run: given scraper has already running.');

  // Registering
  this.scrapers.push(scraper.id);

  // Loading engine
  scraper.engine = new PhantomEngine(scraper, this.spy);

  // Running given scraper
  scraper.run(function(err, remains) {

    // Removing scrapers from list
    _.pullAt(self.scrapers, self.scrapers.indexOf(scraper.id));

    // Autoclosing the spawn?
    // console.log(self.params, self.scrapers)
    if (self.params.autoClose && !self.scrapers.length)
      self.close();

    if (typeof callback !== 'function')
      return;

    if (err)
      return callback(err, remains);

    callback(null, remains);
  });
};

/**
 * Exporting
 */
module.exports = Spawn;
