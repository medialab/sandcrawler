/**
 * Sandcrawler Public Interface
 * =============================
 *
 * Exports Sandcrawler main methods.
 */

var crawler = require('./src/crawler.js');

modules.exports = {
  crawl: crawler.crawl
};
