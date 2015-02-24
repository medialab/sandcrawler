/**
 * Sandcrawler Tests Setup
 * ========================
 *
 * Launches an express server to serve some static files to be scraped.
 */
var api = require('./api.js'),
    fse = require('fs-extra'),
    server;

var tmpPath = __dirname + '/.tmp';

before(function(done) {

  // Launching server
  server = api.listen(7337);

  fse.mkdirs(tmpPath, done);
});

after(function(done) {

  // Closing server
  server.close();

  // Cleaning temporary files
  fse.remove(tmpPath, done);
});
