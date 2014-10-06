/**
 * Sandcrawler Scraper Class
 * ==========================
 *
 * A scraper instance is returned when a crawler starts to feed on a url list.
 * It provides the user with useful chainable utilities and a hand on the final
 * outcome.
 */
function Scraper(spy, feed) {

  // Properties
  this.spy = spy;
  this.feed = feed;

  // Visiting url
  this.spy.messenger.request('page.scrape')
}

// Prototype

module.exports = Scraper;
