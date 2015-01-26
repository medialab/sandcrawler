/**
 * Sandcrawler Public Interface
 * =============================
 *
 * Exposes sandcrawler's API.
 */

// Main object
var core = require('./src/core.js'),
    Scraper = require('./src/scraper.js'),
    StaticEngine = require('./src/engines/static.js');

var sandcrawler = core;

// Non writable properties
Object.defineProperty(sandcrawler, 'version', {
  value: '0.0.2'
});

// Public declarations
sandcrawler.staticScraper = function(name) {
  return new Scraper(name, StaticEngine);
};

// Exporting
module.exports = sandcrawler;
