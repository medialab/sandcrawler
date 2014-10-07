/**
 * Sandcrawler Phantom Bothan Bindings
 * ====================================
 *
 * Defines how phantom child processes should behave when controlled by
 * a sandcrawler instance.
 */
var webpage = require('./custom_page.js');

module.exports = function(messenger, params) {

  // TODO: find more elegant way
  webpage.setup(params);

  // Receiving scraping order
  messenger.on('scrape', function(msg, reply) {

    // Creating webpage
    var page = webpage.create();

    page.open(msg.url, function(status) {

      // Injecting
      page.injectArtoo();

      page.on('callback', function(msg) {

        // On retrieve data, we send back to parent
        if (msg.header = 'done')
          reply(msg.data);
      });

      // Evaluating scraper
      page.evaluateAsync(msg.scraper);
    });
  });
};
