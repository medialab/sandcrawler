/**
 * Sandcrawler Tests Setup
 * ========================
 *
 * Launches an express server to serve some static files to be scraped.
 */
var express = require('express'),
    test = {};

before(function() {

  // Launching server
  test.app = express();
  test.app.use(express.static(__dirname + '/resource'));

  test.server = test.app.listen(8001);
});

after(function() {

  // Closing serve
  test.server.close();
});
