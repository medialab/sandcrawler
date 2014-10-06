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
  test.app.use(express.static(__dirname + '/resources'));

  test.app.listen(8001);
});
