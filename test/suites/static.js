/**
 * Sandcrawler Static Spiders Tests
 * ==================================
 *
 * Testing a spiders using static requests.
 */
var assert = require('assert'),
    sandcrawler = require('../../index.js'),
    samples = require('../samples.js');

describe('When running a static spider', function() {

  describe('Simple use cases', function() {

    it('should work correctly.', function(done) {

      // Creating the spider
      var spider = sandcrawler.staticSpider()
        .url('http://localhost:7337/resources/basic.html')
        .parse(function($) {
          return $('.url-list a').scrape('href');
        })
        .result(function(err, req, res) {
          assert(err === null);
          assert.deepEqual(res.data, samples.basic);
        });

      sandcrawler.run(spider, done);
    });
  });

  describe('Error handling', function() {

    it('should handle status 404.', function(done) {

      var spider = sandcrawler.staticSpider()
        .url('http://localhost:7337/resources/404.html')
        .parse(function($) {
          return $('.url-list a').scrape('href');
        })
        .result(function(err, req, res) {
          assert.strictEqual(err.message, 'status-404');
          assert.strictEqual(err.status, 404);
        });

      sandcrawler.run(spider, done);
    });
  });
});
