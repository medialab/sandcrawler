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

    // Setting fulfilment timeout
    var timeout = setTimeout(function() {
      return page.close();
    }, msg.timeout || 2000);

    // Creating webpage
    var page = webpage.create();

    page.open(msg.url, function(status) {

      // Injecting
      page.injectArtoo();

      // On page callback
      page.on('callback', function(msg) {
        if (msg.header !== 'done')
          return;

        // Canceling timeout
        clearTimeout(timeout);

        // On retrieve data, we send back to parent
        reply({data: msg.data});

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

      // On page error
      page.on('error', function(data, trace) {

        // Sending back to parent
        messenger.send('page:error', {
          taskId: msg.id,
          url: page.url,
          message: data,
          trace: trace
        });
      });

      // Evaluating scraper
      page.evaluateAsync(msg.scraper);
    });
  });
};
