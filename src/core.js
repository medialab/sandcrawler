/**
 * Sandcrawler Core
 * =================
 *
 * Main methods enabling to run spiders and to spawn phantoms.
 */
var spawn = require('./spawn.js'),
    Spider = require('./spider.js'),
    bothan = require('bothan'),
    types = require('./typology.js'),
    defaults = require('../defaults.json'),
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
var sandcrawler = {
  config: function(o) {
    bothan.config(o);

    // Merging spider defaults
    defaults.spider = extend(o.spider, defaults.spider);

    // Merging spawn defaults
    defaults.spawn = extend(o.spawn, defaults.spawn);

    return sandcrawler;
  },
  run: function(spider, callback) {

    if (!types.check(spider, 'spider'))
      throw Error('sandcrawler.run: given argument is not a valid spider.');

    if (spider.state.fulfilled)
      throw Error('sandcrawler.run: given spider has already been fulfilled.');

    if (spider.state.running)
      throw Error('sandcrawler.run: given spider is already running.');

    // Running
    spider.run(callback);
  },
  spawn: spawn
};

/**
 * Exporting
 */
module.exports = sandcrawler;
