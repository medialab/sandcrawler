/**
 * Sandcrawler Core
 * =================
 *
 * Main methods enabling to run spiders and to spawn phantoms.
 */
var path = require('path'),
    artoo = require('artoo-js'),
    defaults = require('../defaults.json'),
    Spawn = require('./spawn.js'),
    Spider = require('./spider.js'),
    bothan = require('bothan'),
    types = require('./typology.js'),
    extend = require('./helpers.js').extend;

/**
 * Extending types
 */
types.add('spider', function(v) {
  return v instanceof Spider;
});

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
sandcrawler.run = function(spider, callback) {

  if (!types.check(spider, 'spider'))
    throw Error('sandcrawler.run: given argument is not a valid spider.');

  if (spider.state.fulfilled)
    throw Error('sandcrawler.run: given spider has already been fulfilled.');

  if (spider.state.running)
    throw Error('sandcrawler.run: given spider is already running.');

  // Running without engine
  if (spider.type === 'static') {
    spider.run(callback);

    return;
  }

  // We need to spawn a default phantom for this spider
  sandcrawler.spawn(function(err, spawn) {
    if (err)
      return callback(err);

    // Running the spider in this newly created spawn
    spawn.run(spider, callback);
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
};

/**
 * Exporting
 */
module.exports = sandcrawler;
