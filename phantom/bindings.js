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

    // Creating webpage
    var page = webpage.create();

    // Setting fulfilment timeout
    var timeout = setTimeout(function() {
      return page.close();
    }, order.timeout || 2000);

    page.open(order.url, function(status) {

      // TODO: act on status !== success

      // Wrapping response helper
      function wrapResponse(o) {
        return {
          data: o,
          url: page.url,
          taskId: order.id
        };
      }

      // On page console message
      page.onConsoleMessage = function(message, lineNum, sourceId) {

        // Sending back to parent
        messenger.send('page:log', wrapResponse({
          message: message,
          line: lineNum,
          source: sourceId
        }));
      };

      // On page error
      page.onError = function(message, trace) {

        // Sending back to parent
        messenger.send('page:error', wrapResponse({
          message: message,
          trace: trace
        }));
      };

      // On page callback
      page.onCallback = function(msg) {
        if (msg.header !== 'done')
          return;

        // Canceling timeout
        clearTimeout(timeout);

        // On retrieve data, we send back to parent
        reply(wrapResponse(msg.data));

        // Closing
        return page.close();
      };

      // Injecting artoo
      page.injectArtoo();

      // Evaluating scraper
      page.evaluateAsync(order.scraper);
    });
  });
};
