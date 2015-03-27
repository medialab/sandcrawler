/**
 * Sandcrawler Spawn
 * ==================
 *
 * Sandcrawler abstract wrapper around a custom phantom child process.
 */
var bothan = require('bothan'),
    path = require('path'),
    artoo = require('artoo-js'),
    uuid = require('uuid'),
    types = require('./typology.js'),
    extend = require('./helpers.js').extend,
    defaults = require('../defaults.json'),
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
  this.spiders = [];
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

// Running the given spider
Spawn.prototype.run = function(spider, callback) {
  var self = this;

  if (!types.check(spider, 'spider'))
    throw Error('sandcrawler.spawn.run: given argument is not a valid spider.');

  if (spider.state.fulfilled)
    throw Error('sandcrawler.spawn.run: given spider has already been fulfilled.');

  if (spider.state.running)
    throw Error('sandcrawler.spawn.run: given spider has already running.');

  // Registering
  this.spiders.push(spider.id);

  // Running given spider
  spider.engine.phantom = this.spy;
  spider._start(function(err, remains) {

    // Removing spiders from list
    _.pullAt(self.spiders, self.spiders.indexOf(spider.id));

    // Autoclosing the spawn?
    if (self.params.autoClose && !self.spiders.length)
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
function fn(p, callback) {

  // Handling polymorphism
  if (typeof p === 'function') {
    callback = p;
    p = null;
  }

  // Merging defaults
  var params = extend(p, defaults.spawn);

  // Registering phantom bindings
  params.bindings = path.join(__dirname, '..', 'phantom', 'bindings.js');

  // Registering phantom required parameters
  params.data = extend(
    {
      paths: {
        // artoo: artoo.paths.phantom,
        artoo: __dirname + '/../temp/artoo.phantom.js',
        jquery: require.resolve('jquery')
      }
    },
    params.data
  );

  // Creating spawn
  var spawn = new Spawn(params);

  // Starting
  spawn.start(function(err) {
    if (err)
      return callback(err);

    callback(null, spawn);
  });
}

fn.abstract = Spawn;
module.exports = fn;
