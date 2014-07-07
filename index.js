/**
 * Sandcrawler Public Interface
 * =============================
 *
 * Exports Sandcrawler main methods.
 */

var crawler = require('./src/crawler.js');

module.exports = {
  crawl: crawler.crawl
};
