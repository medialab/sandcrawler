/**
 * Sandcrawler Crawler Methods
 * ============================
 *
 * Pretty tautological, isn't it?
 */

var taskmaster = require('./taskmaster.js'),
    helpers = require('./helpers.js');

function crawl(url, scraper) {

  // Returning a promise
  return taskmaster.runOne(
    url,
    helpers.artoofy(scraper)
  );
}

module.exports = {
  crawl: crawl
};
