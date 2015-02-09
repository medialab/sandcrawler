/**
 * Sandcrawler Public Interface
 * =============================
 *
 * Exposes sandcrawler's API.
 */

// Main object
var core = require('./src/core.js'),
    Spider = require('./src/spider.js'),
    StaticEngine = require('./src/engines/static.js');

var sandcrawler = core;

// Non writable properties
Object.defineProperty(sandcrawler, 'version', {
  value: '0.0.2'
});

// Public declarations
sandcrawler.spider = function(name) {
  var spider = new Spider(name);
  spider.engine = new StaticEngine(spider);
  spider.type = 'static';
  return spider;
};
sandcrawler.Spider = sandcrawler.spider;

sandcrawler.phantomSpider = function(name) {
  var spider = new Spider(name);
  spider.type = 'phantom';
  return spider;
};
sandcrawler.PhantomSpider = sandcrawler.phantomSpider;

// Exporting
module.exports = sandcrawler;
