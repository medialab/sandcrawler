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
  messenger.on('scrape', function(order, reply) {

    // Setting fulfilment timeout
    var timeout = setTimeout(function() {
      return page.close();
    }, order.timeout || 2000);

    // Creating webpage
    var page = webpage.create();

    page.open(order.url, function(status) {

      // Wrapping response helper
      function wrapResponse(o) {
        return {
          data: o,
          url: page.url,
          taskId: order.id
        };
      }

      // Injecting
      page.injectArtoo();

      // On page callback
      page.on('callback', function(msg) {
        if (msg.header !== 'done')
          return;

        // Canceling timeout
        clearTimeout(timeout);

        // On retrieve data, we send back to parent
        reply(wrapResponse(msg.data));

        // Closing
        return page.close();
      });

      // On page console message
      page.on('consoleMessage', function(message, lineNum, sourceId) {

        // Sending back to parent
        messenger.send('page:log', wrapResponse({
          message: message,
          line: lineNum,
          source: sourceId
        }));
      });

      // On page error
      page.on('error', function(message, trace) {

        // Sending back to parent
        messenger.send('page:error', wrapResponse({
          message: message,
          trace: trace
        }));
      });

      // Evaluating scraper
      page.evaluateAsync(order.scraper);
    });
  });
};
