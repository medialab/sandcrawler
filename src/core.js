/**
 * Sandcrawler Core
 * =================
 *
 * Main methods enabling to run scrapers and to spawn phantoms. Should also
 * hold a register of running phantoms to permit auto-shutdown.
 */
var path = require('path'),
    artoo = require('artoo-js'),
    defaults = require('../defaults.json'),
    helpers = require('./helpers.js'),
    Spawn = require('./spawn.js'),
    scrapers = require('./scrapers'),
    types = require('typology');

// Registering a scraper type
types.add('scraper', function(v) {

  return Object.keys(scrapers).some(function(k) {
    return v instanceof scrapers[k];
  });
});

/**
 * Main Class
 */
function Sandcrawler() {}

/**
 * Prototype
 */

// Running a task in a default phantom
Sandcrawler.prototype.run = function(scraper, callback) {

  if (!types.check(scraper, 'scraper'))
    throw Error('sandcrawler.run: given argument is not a valid scraper.');

  if (scraper.state.done)
    throw Error('sandcrawler.run: given scraper has already been fulfilled.');

  if (scraper.state.running)
    throw Error('sandcrawler.run: given scraper has already running.');

  // Running without engine
  if (scraper.type === 'static') {
    scraper._run(callback);

    return;
  }

  // We need to spawn a default phantom for this scraper
  this.spawn(function(err, spawn) {
    if (err)
      return callback(err);

    // Running the scraper in this newly created spawn
    spawn.run(scraper, callback);
  });
};

// Spawning a custom phantom
Sandcrawler.prototype.spawn = function(p, callback) {

  // Handling polymorphism
  if (typeof p === 'function') {
    callback = p;
    p = null;
  }

  // Merging defaults
  var params = helpers.extend(p, defaults.spawn);

  // Registering phantom bindings
  params.bindings = path.join(__dirname, '..', 'phantom', 'bindings.js');

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
