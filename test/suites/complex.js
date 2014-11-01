/**
 * Sandcrawler Complex Scrapers Tests
 * ===================================
 *
 * Testing some fairly complex use cases such as parallel scrapers etc.
 */
var assert = require('assert'),
    async = require('async'),
    sandcrawler = require('../../index.js'),
    samples = require('../samples.js');

var phantom;

// Helpers
function createMinimalScraper() {
  return new sandcrawler.scraper()
    .url('http://localhost:7337/resources/basic.html')
    .script(__dirname + '/../resources/scrapers/basic.js')
    .result(function(err, req, res) {
      assert.deepEqual(res.data, samples.basic);
    });
}

describe('When running fairly complex scrapers', function() {

  before(function(done) {

    // Spawning a custom phantom for the tests
    sandcrawler.spawn({autoClose: false}, function(err, spawn) {
      if (err) throw err;

      phantom = spawn;
      done();
    });
  });

  describe('Parallel scrapers', function() {

    it('should be possible to run two scrapers using two different phantoms in the same time.', function(done) {
      async.parallel([
        function(next) {
          sandcrawler.run(createMinimalScraper(), next);
        },
        function(next) {
          sandcrawler.run(createMinimalScraper(), next);
        }
      ], done);
    });

    it('should be possible to run two scrapers using the same phantom in the same time.', function(done) {
      async.parallel([
        function(next) {
          phantom.run(createMinimalScraper(), next);
        },
        function(next) {
          phantom.run(createMinimalScraper(), next);
        }
      ], done);
    });
  });

  // describe('Scraper as a service', function() {

  //   it('should be possible to disable autoExit in a crawler.', function(done) {
  //     var count = 0;

  //     var scraper = new sandcrawler.Scraper()
  //       .config({autoExit: false})
  //       .script(__dirname + '/../resources/scrapers/basic.js')
  //       .result(function(err, req, res) {
  //         count++;
  //         assert.deepEqual(res.data, samples.basic);
  //       })
  //       .on('scraper:end', function(err) {
  //         assert.strictEqual(err.message, 'exited');
  //         done();
  //       });

  //     phantom.run(scraper);

  //     var i = 0;

  //     async.whilst(
  //       function() {
  //         return i < 2;
  //       },
  //       function(next) {
  //         i++;
  //         scraper.addUrl('http://localhost:7337/resources/basic.html');
  //         setTimeout(next, 100);
  //       },
  //       function() {
  //         // Done...
  //       }
  //     );
  //   });
  // });

  after(function() {

    // Now closing the phantom
    phantom.close();
  });
});
