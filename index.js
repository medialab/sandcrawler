/**
 * Sandcrawler Public Interface
 * =============================
 *
 * Exposes sandcrawler's API.
 */

// Main object
var core = require('./src/core.js'),
    Spider = require('./src/spider.js'),
    StaticEngine = require('./src/engines/static.js'),
    PhantomEngine = require('./src/engines/phantom.js');

var sandcrawler = core;

// Non writable properties
Object.defineProperty(sandcrawler, 'version', {
  value: '0.1.0-rc1'
});

// Helpers
function capitalize(str) {
  return str.charAt(0).toUpperCase() + str.slice(1);
}

function buildAlias(target, name, prefix) {
  var fn = function() {
    var spider = target.apply(null, arguments);
    spider.denominator = name;
    return spider;
  };

  sandcrawler[prefix ? prefix + capitalize(name) : name] = fn;
  sandcrawler[prefix ? capitalize(prefix) + capitalize(name) : capitalize(name)] = fn;
}

// Public declarations
sandcrawler.spider = function(name) {
  return new Spider(name, StaticEngine);
};
sandcrawler.Spider = sandcrawler.spider;

sandcrawler.phantomSpider = function(name) {
  return new Spider(name, PhantomEngine);
};
sandcrawler.PhantomSpider = sandcrawler.phantomSpider;

// Aliases
buildAlias(sandcrawler.spider, 'droid');
buildAlias(sandcrawler.spider, 'jawa');
buildAlias(sandcrawler.phantomSpider, 'droid', 'phantom');
buildAlias(sandcrawler.phantomSpider, 'jawa', 'phantom');

// Exporting
module.exports = sandcrawler;
