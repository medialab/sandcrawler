/**
 * Sandcrawler Typology
 * =====================
 *
 * Handy data-validation definitions.
 */
var Typology = require('typology');

module.exports = new Typology({
  objectFeed: function(v) {
    return this.check(v, 'object') && (
      this.check(v.url, 'string|object') ||
      !!(v.host || v.hostname)
    );
  },
  feed: function(v) {
    return this.check(v, 'string|objectFeed');
  }
});
