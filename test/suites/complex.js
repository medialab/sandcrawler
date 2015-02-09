/**
 * Sandcrawler Complex Spiders Tests
 * ===================================
 *
 * Testing some fairly complex use cases such as parallel spiders etc.
 */
var assert = require('assert'),
    async = require('async'),
    sandcrawler = require('../../index.js'),
    samples = require('../samples.js');

var phantom;

// Helpers
function createMinimalSpider() {
  return new sandcrawler.phantomSpider()
    .url('http://localhost:7337/resources/basic.html')
    .scraper(require('../resources/scrapers/basic.js'))
    .result(function(err, req, res) {
      assert.deepEqual(res.data, samples.basic);
    });
}

describe('When running fairly complex spiders', function() {

  before(function(done) {

    // Spawning a custom phantom for the tests
    sandcrawler.spawn({autoClose: false}, function(err, spawn) {
      if (err) throw err;

      phantom = spawn;
      done();
    });
  });

  describe('Parallel spiders', function() {

    it('should be possible to run two spiders using two different phantoms in the same time.', function(done) {
      async.parallel([
        function(next) {
          sandcrawler.run(createMinimalSpider(), next);
        },
        function(next) {
          sandcrawler.run(createMinimalSpider(), next);
        }
      ], done);
    });

    it('should be possible to run two spiders using the same phantom in the same time.', function(done) {
      async.parallel([
        function(next) {
          phantom.run(createMinimalSpider(), next);
        },
        function(next) {
          phantom.run(createMinimalSpider(), next);
        }
      ], done);
    });
  });

  // describe('Spider as a service', function() {

  //   it('should be possible to disable autoExit in a crawler.', function(done) {
  //     var count = 0;

  //     var spider = new sandcrawler.Spider()
  //       .config({autoExit: false})
  //       .script(__dirname + '/../resources/scrapers/basic.js')
  //       .result(function(err, req, res) {
  //         count++;
  //         assert.deepEqual(res.data, samples.basic);
  //       })
  //       .on('spider:end', function(err) {
  //         assert.strictEqual(err.message, 'exited');
  //         done();
  //       });

  //     phantom.run(spider);

  //     var i = 0;

  //     async.whilst(
  //       function() {
  //         return i < 2;
  //       },
  //       function(next) {
  //         i++;
  //         spider.addUrl('http://localhost:7337/resources/basic.html');
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
