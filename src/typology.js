/**
 * Sandcrawler Typology
 * =====================
 *
 * Handy data-validation definitions.
 */
var Typology = require('typology'),
    Scraper = require('./scraper.js');

module.exports = new Typology({
  'scraper': function(v) {
    return v instanceof Scraper;
  }
});
