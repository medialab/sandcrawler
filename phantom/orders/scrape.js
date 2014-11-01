/**
 * Sandcrawler Phantom Scrape Order
 * =================================
 *
 * Scraping job handler function.
 */
var webpage = require('webpage'),
    helpers = require('../../src/helpers.js');

module.exports = function(parent, params) {

  return function(msg, reply) {
    var order = msg.body;

    // Order's lifespan
    var lifespan = msg.timeout || 5000;

    // Creating webpage
    var page = webpage.create();

    // Applying precise page settings
    page.settings = helpers.extend(order.params.page || {}, page.settings);

    // Applying precise page headers
    page.customHeaders = helpers.extend(order.params.headers || {}, page.customHeaders);

    /**
     * Enhancing webpage
     */

    // Fallback response object
    page.response = {};
    page.error = {};
    page.isOpened = false;

    function injectArtoo() {

      // Settings
      page.evaluate(function(jsonSettings) {
        var settings = document.createElement('div');
        settings.setAttribute('id', 'artoo_injected_script');
        settings.setAttribute('settings', jsonSettings);

        document.documentElement.appendChild(settings);
      }, JSON.stringify(order.params.artoo));

      // artoo
      page.injectJs(params.paths.artoo);
    }

    // Kill
    function cleanup() {
      if (page.timeout)
        clearTimeout(page.timeout);

      page.close();
    }

    // Creating timeout
    page.timeout = setTimeout(cleanup, lifespan);

    /**
     * Helpers
     */

    // Wrapping response helper
    function wrapFailure(reason) {
      var res = {
        fail: true,
        url: page.url,
        headers: page.response.headers,
        status: page.response.status
      };

      if (reason)
        res.reason = reason;

      if (page.error)
        res.error = page.error;

      return res;
    }

    // Wrapping success helper
    function wrapSuccess(data) {
      return {
        url: page.url,
        headers: page.response.headers,
        status: page.response.status,
        data: data
      };
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

    // On resource error
    page.onResourceError = function(error) {
      if (error.url === order.url || !!~error.url.search(order.url))
        page.error = error;
    };

    // On page callback
    page.onCallback = function(msg) {
      msg = msg || {};

      // If the passphrase is wrong, we break
      if (typeof msg !== 'object' || msg.passphrase !== 'detoo')
        return;

      // Body is now loaded
      if (msg.head === 'documentReady' && page.onDocumentReady)
        return page.onDocumentReady();

      // Page is requesting jquery
      if (msg.head === 'jquery') {
        page.injectJs(params.paths.jquery);
        return page.evaluate(function() {
          artoo.phantom.notify('jquery');
        });
      }

      // Page is returning control
      if (msg.head === 'done') {

        // On retrieve data, we send back to parent
        reply(wrapSuccess(msg.body));

        // Closing
        return cleanup();
      }
    };

    // On body loaded
    page.onDocumentReady = function() {

      // Injecting necessary javascript
      injectArtoo();

      // Evaluating scraper
      page.evaluateAsync(order.script);
    };

    // On page console message
    page.onConsoleMessage = function(message, lineNum, sourceId) {

      // Sending back to parent
      parent.send('page:log', wrapData({
        message: message,
        line: lineNum,
        source: sourceId
      }));
    };

    // On page error
    page.onError = function(message, trace) {

      // Sending back to parent
      parent.send('page:error', wrapData({
        message: message,
        trace: trace
      }));
    };

    // On page alert
    page.onAlert = function(message) {

      // Sending back to parent
      parent.send('page:alert', wrapData({
        message: message
      }));
    };

    // On page change
    var initial = true;
    page.onNavigationRequested = function(url, type, willNavigate, main) {

      // Avoiding first time
      if (initial) {
        initial = false;
        return;
      }

      // Switching url
      order.url = url;
      page.isOpened = false;

      // Requesting response from parent
      parent.request(
        'page:navigation',
        wrapData({
          url: url,
          type: type,
          willNavigate: willNavigate,
          main: main
        }),
        {
          timeout: 2000
        },
        function(err, response) {
          if (err)
            return;

          // Switching to new script
          order.script = response.body;
        }
      );
    };

    page.onLoadFinished = function(status) {

      // Page is now opened
      page.isOpened = true;

      // Failing
      if (status !== 'success') {
        reply(wrapFailure('fail'));
        return cleanup();
      }

      // Wrong status code
      if (!page.response.status || page.response.status >= 400) {
        reply(wrapFailure('status'));
        return cleanup();
      }

      // Waiting for body to load
      page.evaluateAsync(function() {
        var interval = setInterval(function() {
          if (document.readyState === 'complete') {
            clearInterval(interval);
            window.callPhantom({
              head: 'documentReady',
              body: true,
              passphrase: 'detoo'
            });
          }
        }, 30);
      });
    };

    /**
     * Opening url
     */
    page.open(order.url);
  };
};
