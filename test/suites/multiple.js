/**
 * Sandcrawler Multiple Scrapers Tests
 * ====================================
 *
 * Testing some scrapers fetching a discrete series of urls.
 */
var assert = require('assert'),
    sandcrawler = require('../../index.js'),
    samples = require('../samples.js');

var phantom;

describe('When running fairly multi-url scrapers', function() {

  before(function(done) {

    // Spawning a custom phantom for the tests
    sandcrawler.spawn({autoClose: false, port: 7485}, function(err, spawn) {
      if (err) throw err;

      phantom = spawn;
      done();
    });
  });

  describe('Fetching a series of urls', function() {

    it('should work correctly.' , function(done) {
      var count = 0;

      var scraper = new sandcrawler.Scraper()
        .urls([
          'http://localhost:7337/resources/basic.html',
          'http://localhost:7337/resources/basic.html'
        ])
        .script(__dirname + '/../resources/scrapers/basic.js')
        .result(function(err, req, res) {
          count++;

          assert(err === null);
          assert.deepEqual(res.data, samples.basic);
        });

      phantom.run(scraper, function(err) {
        assert(count === 2);
        done();
      });
    });

    it('should be possible to increase maxConcurrency.' , function(done) {
      var count = 0,
          check = false;

      var scraper = new sandcrawler.Scraper()
        .urls([
          {url: 'http://localhost:7337/resources/basic.html', id: 1},
          {url: 'http://localhost:7337/resources/basic.html', id: 2},
          {url: 'http://localhost:7337/resources/basic.html', id: 3}
        ])
        .config({maxConcurrency: 2})
        .script(__dirname + '/../resources/scrapers/basic.js')
        .result(function(err, req, res) {
          count++;

          assert(err === null);
          assert.deepEqual(res.data, samples.basic);
        });

      phantom.run(scraper, function(err) {
        assert(count === 3);
        done();
      });
    });

    it('should be possible to get the remains back after the scraper has been fulfilled.', function(done) {
      var count = 0;

      var scraper = new sandcrawler.Scraper()
        .urls([
          {url: 'http://localhost:7337/resources/basic.html', id: 1},
          {url: 'http://localhost:7337/resources/basic.html', id: 2},
          {url: 'http://localhost:7337/resources/404.html', id: 3}
        ])
        .config({maxConcurrency: 3, timeout: 300})
        .script(__dirname + '/../resources/scrapers/basic.js')
        .result(function(err, req, res) {
          count++;
        });

      phantom.run(scraper, function(err, remains) {
        assert(remains.length === 1);
        assert(count === 3);
        assert.strictEqual(remains[0].id, 3);
        done();
      });
    });
  });

  after(function() {

    // Now closing the phantom
    phantom.close();
  });
});
