/**
 * Sandcrawler Typology
 * =====================
 *
 * Handy data-validation definitions.
 */
var Typology = require('typology'),
    Spider = require('./spider.js');

module.exports = new Typology({
  'spider': function(v) {
    return v instanceof Spider;
  }
});
