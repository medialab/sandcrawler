/**
 * Sandcrawler Simple Scrapers Tests
 * ==================================
 *
 * Testing some simple scrapers use cases.
 */
var assert = require('assert'),
    sandcrawler = require('../../index.js');

// Data
var data = {},
    phantom;

describe('When running fairly simple scrapers', function() {

  before(function(done) {

    // Spawning a custom phantom for the tests
    sandcrawler.spawn({autoClose: false, port: 7484}, function(err, spawn) {
      if (err) throw err;

      phantom = spawn;
      done();
    });
  });

  describe('Event subscription', function() {

    it('should be possible to subscribe to page log.', function(done) {
      var i = 0;

      var scraper = new sandcrawler.Scraper()
        .url('http://localhost:7337/resources/basic.html')
        .script(__dirname + '/../resources/scrapers/logger.js')
        .on('page:log', function(message) {
          i++

          // TODO: change when artoo logging issue is solved
          if (i === 3)
            assert.strictEqual(message, 'Hello world!');
        });

      phantom.run(scraper, done);
    });
  });

  after(function() {

    // Now closing the phantom
    phantom.close();
  });
});
