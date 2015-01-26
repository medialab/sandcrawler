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
    Spawn = require('./spawn.js'),
    Scraper = require('./scraper.js'),
    bothan = require('bothan'),
    types = require('./typology.js'),
    extend = require('./helpers.js').extend;

/**
 * Main interface
 */
var sandcrawler = {};

// Configuration
sandcrawler.config = function(o) {
  bothan.config(o);
  return sandcrawler;
};

// Running a task in a default phantom
sandcrawler.run = function(scraper, callback) {

  if (!types.check(scraper, 'scraper'))
    throw Error('sandcrawler.run: given argument is not a valid scraper.');

  if (scraper.state.fulfilled)
    throw Error('sandcrawler.run: given scraper has already been fulfilled.');

  if (scraper.state.running)
    throw Error('sandcrawler.run: given scraper is already running.');

  // Running without engine
  if (scraper.type === 'static') {
    scraper._run(callback);

    return;
  }

  // We need to spawn a default phantom for this scraper
  sandcrawler.spawn(function(err, spawn) {
    if (err)
      return callback(err);

    // Running the scraper in this newly created spawn
    spawn.run(scraper, callback);
  });
};

// Spawning a custom phantom
sandcrawler.spawn = function(p, callback) {

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
module.exports = sandcrawler;
