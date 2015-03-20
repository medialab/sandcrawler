/**
 * Sandcrawler Phantom Bothan Bindings
 * ====================================
 *
 * Defines how phantom child processes should behave when controlled by
 * a sandcrawler instance.
 */
var webpage = require('webpage'),
    helpers = require('../src/helpers.js'),
    extend = helpers.extend;

module.exports = function(parent, params) {

  // Executing on scrape
  parent.on('scrape', function(msg) {
    var order = msg.body,
        callId = msg.id;

    // Order's lifespan
    var lifespan = order.timeout || 5000;

    // Creating webpage
    var page = webpage.create();

    // Applying precise page settings
    page.settings = extend(order.page, page.settings);

    // Checking headers for User-Agent
    if (order.headers) {
      var values = [],
          names = Object.keys(order.headers).map(function(n) {
            values.push(order.headers[n]);
            return n.toLowerCase();
          });

      var idx = names.indexOf('user-agent');

      if (~idx)
        page.settings.userAgent = values[idx];
    }

    if (order.cookies)
      order.cookies.forEach(function(cookie) {
        phantom.addCookie(cookie);
      });

    /**
     * Utilities
     */

    // Fallback response object
    var pageInformation = {
      status: null,
      response: {},
      error: {},
      isOpened: false
    };

    function injectArtoo() {

      // Backup of local jQuery
      page.evaluate(function() {
        if (window.jQuery)
          window.artooBackupJQuery = window.jQuery;
      });

      // Injecting ours
      page.injectJs(params.paths.jquery);

      // Cleaning up
      page.evaluate(function() {
        window.artooPhantomJQuery = window.jQuery.noConflict();
        if (window.artooBackupJQuery) {
          window.jQuery = window.artooBackupJQuery;
          delete window.artooBackupJQuery;
        }
      });

      // Artoo settings
      page.evaluate(function(jsonSettings) {
        var settings = document.createElement('div');
        settings.setAttribute('id', 'artoo_injected_script');
        settings.setAttribute('settings', jsonSettings);

        document.documentElement.appendChild(settings);
      }, JSON.stringify(order.artoo));

      // Main script (this will eradicate our jQuery version from window)
      page.injectJs(params.paths.artoo);
    }

    // Kill
    function cleanup() {

      // Cleaning timeout and interval
      if (damocles)
        clearTimeout(damocles);
      if (sisyphus)
        clearInterval(sisyphus);

      // Deleting data
      pageInformation = null;

      // Shunting some callbacks
      [
        'onNavigationRequested',
        'onResourceReceived',
        'onResourceError',
        'onUrlChanged',
        'onCallback',
        'onLoadFinished'
      ].forEach(function(n) {
        page[n] = Function.prototype;
      });

      // Cleaning page to force garbage collection
      page.evaluate(function() {

        // Cleaning timeouts and intervals
        var t = setTimeout(Function.prototype, 0),
            i = setInterval(Function.prototype, 100);

        while (t--) clearTimeout(t);
        while (i--) clearInterval(i);

        // Deleting current document
        document.open();
        document.close();

        // Deleting every variables belonging to the global scope
        Object.keys(window).forEach(function(k) {
          delete window[k];
        });
      });

      page.open('about:blank', function() {

        // Closing page
        page.close();

        // Annihilating page
        page = null;

        // Cleaning order
        order = null;
        msg = null;
      });
    }

    // Creating timeout
    var damocles = setTimeout(cleanup, lifespan),
        sisyphus;

    /**
     * Helpers
     */

    // Get correct page content
    function getContent() {
      var h = pageInformation.response.headers || {};
      if (/json/.test(h['content-type'])) {
        try {
          return JSON.parse(page.plainText);
        }
        catch (e) {
          return page.content;
        }
      }
      else {
        return page.content;
      }
    }

    // Wrapping response helper
    function wrapFailure(reason) {
      var res = {
        fail: true,
        url: page.url,
        body: getContent(),
        headers: pageInformation.response.headers,
        status: pageInformation.response.status
      };

      if (reason)
        res.reason = reason;

      if (pageInformation.error)
        res.error = pageInformation.error;

      return res;
    }

    // Wrapping success helper
    function wrapSuccess(result) {
      return {
        url: page.url,
        body: getContent(),
        headers: pageInformation.response.headers,
        status: pageInformation.response.status,
        error: result.error ? helpers.serializeError(result.error) : null,
        data: result.data
      };
    }

    // Wrapping data helper
    function wrapData(o) {
      return {
        data: o,
        callId: callId
      };
    }

    /**
     * Registering global page callbacks
     */

    // On url changed, we track it
    // TODO: track redirects
    page.onUrlChanged = function(targetUrl) {
      order.url = targetUrl;
    };

    // On resource received
    page.onResourceReceived = function(response) {

      // Is the resource matching the page's url?
      if (pageInformation.isOpened || response.url !== order.url)
        return;


      // Formatting headers
      if (response.headers) {
        var headers = {};
        response.headers.forEach(function(h) {
          headers[h.name.toLowerCase()] = h.value;
        });
        response.headers = headers;
      }

      pageInformation.response = response;
    };

    // On resource error
    page.onResourceError = function(error) {
      if (error.url === order.url || !!~error.url.search(order.url))
        pageInformation.error = error;
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

      // Page is trying to close phantom
      // NOTE: cleanup is async here to avoid page log generated by
      // phantomjs pages teardown process.
      if (msg.head === 'exit') {
        cleanup();
        return setTimeout(function() {
          phantom.exit(msg.body || 0);
        }, 0);
      }

      // Page is returning control
      if (msg.head === 'done') {

        // On retrieve data, we send back to parent
        parent.replyTo(callId, wrapSuccess(msg.body));

        // Closing
        return cleanup();
      }
    };

    // On body loaded
    page.onDocumentReady = function() {

      // Injecting necessary javascript
      injectArtoo();

      // If no scraper was supplied
      if (!order.script)
        return parent.replyTo(callId, wrapSuccess({data: null}));

      // Evaluating scraper
      if (order.synchronousScript) {
        var data = page.evaluate(order.script);

        // Replying to parent
        parent.replyTo(callId, wrapSuccess({data: data}));

        // Closing
        return cleanup();
      }
      else {
        page.evaluateAsync(order.script);
      }
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

    // On navigation
    var firstTime = true;
    page.onNavigationRequested = function(url, type, willNavigate, main) {

      // We only want the main frame
      if (!main)
        return;

      if (firstTime)
        return (firstTime = false);

      if (!willNavigate)
        return;

      // Page is no longer opened
      pageInformation.isOpened = false;
      pageInformation.status = null;

      // Caching the callback
      page.onLoadFinished = function(status) {
        pageInformation.isOpened = true;
        pageInformation.status = status;
      };

      parent.request(

        // Notifying navigation
        'page:navigation',

        // Message body
        wrapData({
          to: url,
          type: type
        }),

        // On answer
        function(err, msg) {
          if (err)
            return;

          // Setting new scraper
          order.script = msg.body;

          // Waiting for the page to open
          // NOTE: dirty hack because of a phantomjs bug messing with the
          // onLoadFinished callback.
          sisyphus = setInterval(function() {
            if (!pageInformation.isOpened)
              return;

            clearInterval(sisyphus);
            onLoadFinished(pageInformation.status);
          }, 30);
        }
      );
    };

    // When page load is finished
    var onLoadFinished = function(status) {

      // Page is now opened
      pageInformation.isOpened = true;
      pageInformation.status = status;

      // Failing
      if (status !== 'success') {
        parent.replyTo(callId, wrapFailure('fail'));
        return cleanup();
      }

      // Wrong status code
      if (!pageInformation.response.status || pageInformation.response.status >= 400) {
        parent.replyTo(callId, wrapFailure('status'));
        return cleanup();
      }

      // Waiting for body to load
      page.evaluateAsync(function() {
        var interval = setInterval(function() {
          if (document.readyState === 'complete' || document.readyState === 'interactive') {
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
    var request = {
      encoding: order.encoding || 'utf-8',
      operation: order.method || 'GET'
    };

    if (order.headers)
      request.headers = order.headers;

    if (order.body)
      request.data = order.body;

    page.open(order.url, request, onLoadFinished);
  });
};
