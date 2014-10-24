/**
 * Sandcrawler Validate Plugin
 * ============================
 *
 * Gives a chance to validate the received data before attempting anything.
 */
var types = require('typology');

module.exports = function(definition) {

  return function(scraper) {

    // Adding a middleware to the afterScraping stack
    scraper.afterScraping(function(req, res, next) {
      var valid = true;

      if (typeof definition === 'function')
        valid = definition(res.data);
      else
        valid = types.check(res.data, definition);

      return next(valid ? null : new Error('invalid-data'));
    });
  };
};
