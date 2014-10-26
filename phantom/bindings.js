/**
 * Sandcrawler Phantom Bothan Bindings
 * ====================================
 *
 * Defines how phantom child processes should behave when controlled by
 * a sandcrawler instance.
 */
var webpage = require('webpage'),
    polyfills = require('./polyfills.js');

module.exports = function(messenger, params) {

  /**
   * Scraping order
   */
  messenger.on('scrape', function(order, reply) {

    // Order's lifespan
    var lifespan = order.timeout || 5000;

    // Creating webpage
    var page = webpage.create();

    /**
     * Enhancing webpage
     */

    // Fallback response object
    page.response = {};
    page.isOpened = false;

    // TODO: inject jQuery safely by requesting it with artoo
    // TODO: find a way to setup artoo finely
    function injectArtoo() {

      // jQuery
      page.injectJs(params.paths.jquery);

      // artoo settings
      page.evaluate(function() {
        var settings = document.createElement('div');
        settings.setAttribute('id', 'artoo_injected_script');
        settings.setAttribute('settings', '{"log":{"welcome": false}}');

        document.body.appendChild(settings);
      });

      // artoo
      page.injectJs(params.paths.artoo);
    };

    // Kill
    function cleanup() {
      if (page.timeout)
        clearTimeout(page.timeout);

      page.close();
    };

    // Creating timeout
    page.timeout = setTimeout(cleanup, lifespan);

    /**
     * Helpers
     */

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

    // Wrapping data helper
    function wrapData(o) {
      return {
        data: o,
        jobId: order.id
      };
    }

    /**
     * Registering global page callbacks
     */

    // On resource received
    // TODO: track redirects
    page.onResourceReceived = function(response) {
      if (page.isOpened || response.url !== order.url)
        return;

      // Is the resource matching the page's url?
      page.response = response;
    };

    // On page callback
    page.onCallback = function(msg) {

      // Page is returning control
      if (msg.header === 'done') {

        // On retrieve data, we send back to parent
        reply(wrapResponse(msg.data));

        // Closing
        return cleanup();
      }
    };

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


    /**
     * Opening url
     */
    page.open(order.url, function(status) {

      // Page is now opened
      page.isOpened = true;

      // Failing
      if (status !== 'success') {
        reply(wrapResponse(null, 'fail'));
        return cleanup();
      }

      // Wrong status code
      if (!page.response.status || page.response.status >= 400) {
        reply(wrapResponse(null, 'status'));
        return cleanup();
      }

      // Injecting necessary javascript
      injectArtoo();

      // Evaluating scraper
      page.evaluateAsync(order.scraper);
    });
  });
};
