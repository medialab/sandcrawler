/**
 * Sandcrawler Phantom Bothan Bindings
 * ====================================
 *
 * Defines how phantom child processes should behave when controlled by
 * a sandcrawler instance.
 */
var webpage = require('./custom_page.js'),
    polyfills = require('./polyfills.js');

module.exports = function(messenger, params) {

  // TODO: find more elegant way
  webpage.setup(params);

  // Receiving scraping order
  messenger.on('scrape', function(order, reply) {

    // Creating webpage
    var page = webpage.create(order.timeout || 5000);

    // Opening url
    page.open(order.url, function(status) {

      // Wrapping response helper
      function wrapResponse(o, err) {
        var res = {
          data: o,
          url: page.url,
          headers: page.response.headers,
          status: page.response.status
        };

        if (err)
          res.error = err;

        return res;
      }

      function wrapData(o) {
        return {
          data: o,
          jobId: order.id
        };
      }

      // Failing
      if (status !== 'success') {
        reply(wrapResponse(null, 'fail'));
        return page.cleanup();
      }

      /**
       * Success page callbacks
       */

      // On page console message
      page.onConsoleMessage = function(message, lineNum, sourceId) {

        // Sending back to parent
        messenger.send('page:log', wrapData({
          message: message,
          line: lineNum,
          source: sourceId
        }));
      };

      // On page error
      page.onError = function(message, trace) {

        // Sending back to parent
        messenger.send('page:error', wrapData({
          message: message,
          trace: trace
        }));
      };

      // On page callback
      page.onCallback = function(msg) {
        if (msg.header !== 'done')
          return;

        // On retrieve data, we send back to parent
        reply(wrapResponse(msg.data));

        // Closing
        return page.cleanup();
      };

      // Injecting artoo
      page.injectArtoo();

      // Evaluating scraper
      page.evaluateAsync(order.scraper);
    });


    /**
     * Global page callbacks
     */

    // On resource received
    page.onResourceReceived = function(response) {

      // Is the resource matching the page's url?
      // TODO: track url changes
      if (response.stage === 'end' && response.url !== order.url)
        return;

      page.response = response;
    };
  });
};
