/**
 * Sandcrawler Tests Setup
 * ========================
 *
 * Launches an express server to serve some static files to be scraped.
 */
var api = require('./api.js'),
    server;

before(function() {

  // Launching server
  server = api.listen(7337);
});

after(function() {

  // Closing server
  server.close();
});
