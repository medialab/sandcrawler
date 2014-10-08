/**
 * Sandcrawler Public Interface
 * =============================
 *
 * Exposes sandcrawler's API.
 */

// Main object
var sandcrawler = {
  create: require('./src/crawler.js')
};

// Non writable properties
Object.defineProperty(sandcrawler, 'version', {
  value: '0.0.1'
});

// Exporting
module.exports = sandcrawler;
