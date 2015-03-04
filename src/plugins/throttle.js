/**
 * Sandcrawler Throttle Plugin
 * ============================
 *
 * Simple plugin designed to throttle the spider's jobs.
 */
var types = require('typology');

// Helpers
function randomNumber(min, max) {
  return Math.random() * (max - min) + min;
}

// Exporting plugin
module.exports = function(min, max) {

  if (!types.check(min, 'number') ||
      !types.check(max, '?number'))
    throw Error('sandcrawler.spider.throttle: wrong arguments.');

  return function(spider) {

    spider.beforeScraping(function(req, next) {
      if (!this.index)
        return next();

      var time = max ? randomNumber(min, max) : min + Math.random();

      setTimeout(next, time);
    });
  };
};
