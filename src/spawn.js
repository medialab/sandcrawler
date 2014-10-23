/**
 * Sandcrawler Spawn
 * ==================
 *
 * Sandcrawler abstract wrapper around a custom phantom child process.
 */
var bothan = require('bothan'),
    uuid = require('uuid'),
    types = require('typology');

/**
 * Main Class
 */
function Spawn(params) {

  // Properties
  this.id = 'Spawn[' + uuid.v4() + ']';
  this.params = params;
  this.spy = null;
  this.closed = false;

  // Hidden properties
  this._runningScrapers = {};
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

    callback();
  });
};

// Stopping the child phantom
Spawn.prototype.close = function() {
  if (this.closed)
    throw Error('sandcrawler.spawn.close: spawn already closed.');

  this.closed = true;

  // TODO: kill socket server only if last one using it
  this.spy.spynet.close();
  this.spy.kill();

  return this;
};

// Running the given task
Spawn.prototype.run = function(scraper, callback) {

  if (!types.check(scraper, 'scraper'))
    throw Error('sandcrawler.spawn.run: given argument is not a valid scraper.');

  // Listening to task ending
  // TODO: provide autoclose here
  scraper.on('task:fail', callback);
  scraper.on('task:success', function() {
    callback(null);
  });

  // Starting
  scraper._run(this);
}

/**
 * Exporting
 */
module.exports = Spawn;
