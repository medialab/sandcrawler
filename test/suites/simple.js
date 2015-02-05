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
    sandcrawler.spawn({autoClose: false}, function(err, spawn) {
      if (err) throw err;

      phantom = spawn;
      done();
    });
  });

  after(function() {

    // Now closing the phantom
    phantom.close();
  });

  describe('Minimal use case', function() {

    it('should work correctly.', function(done) {

      // Creating the scraper
      var scraper = sandcrawler.scraper()
        .url('http://localhost:7337/resources/basic.html')
        .script(__dirname + '/../resources/scrapers/basic.js')
        .result(function(err, req, res) {
          assert.deepEqual(res.data, samples.basic);
        });

      // Running the scraper
      sandcrawler.run(scraper, function(err) {
        assert(err === null);
        done();
      });
    });
  });

  describe('Event subscription', function() {

    it('should be possible to subscribe to page log.', function(done) {

      var scraper = sandcrawler.scraper()
        .url('http://localhost:7337/resources/basic.html')
        .script(__dirname + '/../resources/scrapers/logger.js')
        .on('page:log', function(data, req, res) {
          assert.strictEqual(req.url, 'http://localhost:7337/resources/basic.html');
          assert.strictEqual(data.message, 'Hello world!');
        });

      phantom.run(scraper, done);
    });

    it('should be possible to subscribe to page errors.', function(done) {

      var scraper = sandcrawler.scraper()
        .url('http://localhost:7337/resources/basic.html')
        .config({timeout: 300})
        .script(__dirname + '/../resources/scrapers/error.js', false)
        .on('page:error', function(data) {
          assert.strictEqual(data.message, 'Error: random-error');
        });

      phantom.run(scraper, done);
    });

    it('should be possible to subscribe to page alerts.', function(done) {

      var scraper = sandcrawler.scraper()
        .url('http://localhost:7337/resources/basic.html')
        .script(__dirname + '/../resources/scrapers/alert.js')
        .on('page:alert', function(data) {
          assert.strictEqual(data.message, 'Hello world!');
        });

      phantom.run(scraper, done);
    });
  });

  describe('Error handling', function() {
    var globalScraper = sandcrawler.scraper()
        .url('http://localhost:7337/resources/basic.html')
        .timeout(200)
        .result(function(err) {
          assert.strictEqual(err.message, 'timeout');
        });

    it('should timeout correctly.', function(done) {
      phantom.run(globalScraper, done);
    });

    it('should throw an error when running a fulfilled scraper.', function() {

      assert.throws(function() {
        sandcrawler.run(globalScraper);
      }, /fulfilled/);

      assert.throws(function() {
        phantom.run(globalScraper);
      }, /fulfilled/);
    });

    it('should dispatch an error when phantom failed to grasp the page.', function(done) {
      var scraper = sandcrawler.scraper()
        .url('inexistantpage.html')
        .script(__dirname + '/../resources/scrapers/logger.js')
        .result(function(err, req, res) {
          assert.strictEqual(err.message, 'phantom-fail');
        });

      phantom.run(scraper, done);
    });

    it('should dispatch an error when the page status is not correct.', function(done) {
      var scraper = sandcrawler.scraper()
        .url('http://localhost:7337/resources/404.html')
        .script(__dirname + '/../resources/scrapers/logger.js')
        .result(function(err, req, res) {
          assert.strictEqual(err.message, 'status-404');
        });

      phantom.run(scraper, done);
    });
  });

  Function.prototype('Jawascript', function() {

    it('should be possible to run some jawascript from a function.', function(done) {

      var scraper = sandcrawler.scraper()
        .url('http://localhost:7337/resources/basic.html')
        .jawascript(function(done) {
          artoo.done(artoo.scrape('.url-list a', 'href'));
        })
        .result(function(err, req, res) {
          assert.deepEqual(res.data, samples.basic);
        });

      phantom.run(scraper, done);
    });

    it('should be possible to run some jawascript from a string.', function(done) {

      var scraper = sandcrawler.scraper()
        .url('http://localhost:7337/resources/basic.html')
        .jawascript("artoo.done(artoo.scrape('.url-list a', 'href'));")
        .result(function(err, req, res) {
          assert.deepEqual(res.data, samples.basic);
        });

      phantom.run(scraper, done);
    });

    it('should be possible to notify phantom with done.', function(done) {

      var scraper = sandcrawler.scraper()
        .url('http://localhost:7337/resources/basic.html')
        .jawascript(function(done) {
          var data = artoo.scrape('.url-list a', 'href');
          done(data);
        })
        .result(function(err, req, res) {
          assert.deepEqual(res.data, samples.basic);
        });

      phantom.run(scraper, done);
    });
  });

  Function.prototype('jQuery', function() {

    it('should be possible to inject jQuery without breaking the page.', function(done) {
      var scraper = sandcrawler.scraper()
        .url('http://localhost:7337/resources/jquery.html')
        .jawascript(function(done) {
          var data = {
            fromDollar: window.$,
            fromArtoo: $('p').scrapeOne()
          };
          return done(data);
        })
        .result(function(err, req, res) {
          assert.deepEqual(res.data, {
            fromDollar: 'hello',
            fromArtoo: 'welcome'
          });
        });

      phantom.run(scraper, done);
    });
  });

  Function.prototype('Plugins', function() {

    it('should be possible to use a plugin.', function(done) {

      var scraper = sandcrawler.scraper()
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

  Function.prototype('Feed', function() {

    it('should be possible to set arbitrary data to jobs.', function(done) {
      var scraper = sandcrawler.scraper()
        .url({
          url: 'http://localhost:7337/resources/basic.html',
          data: {
            ok: true
          }
        })
        .script(__dirname + '/../resources/scrapers/basic.js')
        .beforeScraping(function(req, next) {
          assert(req.data.ok);
          req.data.hello = 'world';
          next();
        })
        .afterScraping(function(req, res, next) {
          assert.strictEqual(req.data.hello, 'world');
          next();
        });

        phantom.run(scraper, done);
    });
  });

  Function.prototype('Data validation', function() {

    it('should be possible to validate data with a function.', function(done) {

      var scraper = sandcrawler.scraper()
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

      var scraper = sandcrawler.scraper()
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

      var scraper = sandcrawler.scraper()
        .url('http://localhost:7337/resources/basic.html')
        .script(__dirname + '/../resources/scrapers/basic.js')
        .validate('?string')
        .result(function(err, req, res) {
          assert.strictEqual(err.message, 'invalid-data');
        });

      phantom.run(scraper, done);
    });
  });

  Function.prototype('Page customization', function(done) {

    it('should be possible to set your own user agent.', function(done) {

      var scraper = sandcrawler.scraper()
        .url('http://localhost:7337/useragent')
        .config({
          params: {
            page: {
              userAgent: 'tada'
            }
          }
        })
        .jawascript(function(done) {
          done($('body').scrapeOne());
        })
        .result(function(err, req, res) {
          assert.strictEqual(res.data, 'Yay!');
        });

      phantom.run(scraper, done);
    });

    it('should be possible to set your own headers.', function(done) {

      var scraper = sandcrawler.scraper()
        .url('http://localhost:7337/headers')
        .config({
          params: {
            headers: {
              'x-tada': 'valid'
            }
          }
        })
        .jawascript(function(done) {
          done($('body').scrapeOne());
        })
        .result(function(err, req, res) {
          assert.strictEqual(res.data, 'Yay!');
        });

      phantom.run(scraper, done);
    });
  });
});
