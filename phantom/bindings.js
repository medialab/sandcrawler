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

      // On page callback
      page.on('callback', function(msg) {

        // On retrieve data, we send back to parent
        if (msg.header = 'done')
          reply(msg.data);

        // Closing
        return page.close();
      });

      // On page console message
      page.on('consoleMessage', function(data, lineNum, sourceId) {

        // Sending back to parent
        messenger.send('page:log', {
          taskId: msg.id,
          url: page.url,
          message: data,
          line: lineNum,
          source: sourceId
        });
      });

      // Evaluating scraper
      page.evaluateAsync(msg.scraper);
    });
  });
};
