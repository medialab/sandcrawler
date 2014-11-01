/**
 * Sandcrawler Public Interface
 * =============================
 *
 * Exposes sandcrawler's API.
 */

// Main object
var core = require('./src/core.js'),
    scrapers = require('./src/scrapers');

var sandcrawler = core;

// Non writable properties
Object.defineProperty(sandcrawler, 'version', {
  value: '0.0.1'
});

// Public classes
sandcrawler.scraper = scrapers.dynamic;
sandcrawler.Scraper = scrapers.dynamic;
sandcrawler.agent = scrapers.dynamic;
sandcrawler.Agent = scrapers.dynamic;
sandcrawler.staticScraper = scrapers.static;
sandcrawler.StaticScraper = scrapers.static;

// Exporting
module.exports = sandcrawler;
