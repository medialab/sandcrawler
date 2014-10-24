/**
 * Sandcrawler Simple Scrapers Tests
 * ==================================
 *
 * Testing some simple scrapers use cases.
 */
var assert = require('assert'),
    sandcrawler = require('../../index.js'),
    validate = require('../../src/plugins/validate.js'),
    samples = require('../samples.js');

var phantom;

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
        .on('page:log', function(data) {
          i++

          // TODO: change when artoo logging issue is solved
          if (i === 3)
            assert.strictEqual(data.message, 'Hello world!');
        });

      phantom.run(scraper, done);
    });

    it('should be possible to subscribe to page errors.', function(done) {

      var scraper = new sandcrawler.Scraper()
        .url('http://localhost:7337/resources/basic.html')
        .config({timeout: 500})
        .script(__dirname + '/../resources/scrapers/error.js')
        .on('page:error', function(data) {
          assert.strictEqual(data.message, 'Error: random-error');
        });

      phantom.run(scraper, done);
    });
  });

  describe('Plugins', function() {

    it('should be possible to use a plugin.', function(done) {

      var scraper = new sandcrawler.Scraper()
        .url('http://localhost:7337/resources/basic.html')
        .script(__dirname + '/../resources/scrapers/basic.js')
        .use(validate('array'))
        .result(function(err, req, res) {
          assert(err === null);
          assert.deepEqual(res.data, samples.basic);
        });

      phantom.run(scraper, done);
    });
  });

  describe('Data validation', function() {

    it('should be possible to validate data with a function.', function(done) {

      var scraper = new sandcrawler.Scraper()
        .url('http://localhost:7337/resources/basic.html')
        .script(__dirname + '/../resources/scrapers/basic.js')
        .validate(function(data) {
          return data instanceof Array;
        })
        .result(function(err, req, res) {
          assert(err === null);
          assert.deepEqual(res.data, samples.basic);
        });

      phantom.run(scraper, done);
    });

    it('should be possible to validate data with a type.', function(done) {

      var scraper = new sandcrawler.Scraper()
        .url('http://localhost:7337/resources/basic.html')
        .script(__dirname + '/../resources/scrapers/basic.js')
        .validate('array')
        .result(function(err, req, res) {
          assert(err === null);
          assert.deepEqual(res.data, samples.basic);
        });

      phantom.run(scraper, done);
    });

    it('should fail the job whenever validation fails.', function(done) {

      var scraper = new sandcrawler.Scraper()
        .url('http://localhost:7337/resources/basic.html')
        .script(__dirname + '/../resources/scrapers/basic.js')
        .validate('?string')
        .result(function(err, req, res) {
          assert.strictEqual(err.message, 'invalid-data');
        });

      phantom.run(scraper, done);
    });
  });

  after(function() {

    // Now closing the phantom
    phantom.close();
  });
});
