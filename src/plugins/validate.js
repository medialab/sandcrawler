/**
 * Sandcrawler Validate Plugin
 * ============================
 *
 * Gives a chance to validate the received data before attempting anything.
 */
var types = require('typology');

module.exports = function(definition) {

  // The function applied by and to the spider
  return function(spider) {

    // Adding a middleware to the afterScraping stack
    spider.afterScraping(function(req, res, next) {
      var valid = true;

      if (typeof definition === 'function')
        valid = definition(res.data);
      else
        valid = types.check(res.data, definition);

      return next(valid ? null : new Error('invalid-data'));
    });
  };
};
