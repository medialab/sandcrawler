/**
 * Sandcrawler Core
 * =================
 *
 * Main methods enabling to run scrapers and to spawn phantoms. Should also
 * hold a register of running phantoms to permit auto-shutdown.
 */
var path = require('path'),
    artoo = require('artoo-js'),
    config = require('../config.json'),
    helpers = require('./helpers.js'),
    Spawn = require('./spawn.js');

/**
 * Main Class
 */
function Sandcrawler() {

  // Hidden properties
  this._runningPhantoms = {};
}

/**
 * Prototype
 */

// Spawning a custom phantom
Sandcrawler.prototype.spawn = function(p, callback) {

  // Handling polymorphism
  if (typeof p === 'function') {
    callback = p;
    p = null;
  }

  // Merging defaults
  var params = helpers.extend(p, config.spawn);

  // Registering phantom bindings
  params.bindings = path.join(
    __dirname, '..', 'phantom', 'bindings.js');

  // Registering phantom required parameters
  params.data = helpers.extend(
    {
      paths: {
        artoo: artoo.paths.phantom,
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
};

/**
 * Exporting
 */
module.exports = new Sandcrawler();
