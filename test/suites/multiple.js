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

describe('When running multi-url scrapers', function() {

  before(function(done) {

    // Spawning a custom phantom for the tests
    sandcrawler.spawn({autoClose: false}, function(err, spawn) {
      if (err) throw err;

      phantom = spawn;
      done();
    });
  });

  describe('Series', function() {

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
        })
        .on('scraper:end', function(status, remains) {
          assert.strictEqual(status, 'success');
          assert.strictEqual(remains[0].id, 3);
          assert(remains.length === 1);
        });

      phantom.run(scraper, function(err, remains) {
        assert(remains.length === 1);
        assert(count === 3);
        assert.strictEqual(remains[0].id, 3);
        done();
      });
    });
  });

  describe('Iterator', function() {

    it('should be possible to use a function as iterator.', function(done) {
      var count = 0;

      var scraper = new sandcrawler.Scraper()
        .iterate(function(i, req, res) {
          if (i === 3)
            return false;

          return !i ?
            'http://localhost:7337/resources/basic.html' :
            res.data.nextPage;
        })
        .jawascript(function(done) {
          done({nextPage: 'http://localhost:7337/resources/basic.html'});
        })
        .result(function(err, req, res) {
          count++;
        });

      phantom.run(scraper, function() {
        assert(count === 3);
        done();
      });
    });

    it('should be possible to set a limit to the iterator.', function(done) {
      var count = 0;

      var scraper = new sandcrawler.Scraper()
        .iterate(function(i, req, res) {
          return 'http://localhost:7337/resources/basic.html';
        })
        .config({limit: 3})
        .jawascript(function(done) {
          done();
        })
        .result(function() {
          count++;
        });

      phantom.run(scraper, function() {
        assert(count === 3);
        done();
      });
    });

    it('should be possible to use the limit shorthand.', function(done) {
      var count = 0;

      var scraper = new sandcrawler.Scraper()
        .iterate(function(i, req, res) {
          return 'http://localhost:7337/resources/basic.html';
        })
        .limit(3)
        .jawascript(function(done) {
          done();
        })
        .result(function() {
          count++;
        });

      phantom.run(scraper, function() {
        assert(count === 3);
        done();
      });
    });

    it('should be possible to start from a single url.', function(done) {
      var count = 0;

      var scraper = new sandcrawler.Scraper()
        .url('http://localhost:7337/resources/basic.html')
        .iterate(function(i, req, res) {
          if (i === 3)
            return false;

          return res.data.nextPage;
        })
        .jawascript(function(done) {
          done({nextPage: 'http://localhost:7337/resources/basic.html'});
        })
        .result(function(err, req, res) {
          count++;
        });

      phantom.run(scraper, function() {
        assert(count === 3);
        done();
      });
    });

    it('should be possible to start from a list of urls.', function(done) {
      var count = 0;

      var scraper = new sandcrawler.Scraper()
        .urls([
          'http://localhost:7337/resources/basic.html',
          'http://localhost:7337/resources/basic.html'
        ])
        .iterate(function(i, req, res) {
          if (i === 5)
            return false;

          return res.data.nextPage;
        })
        .jawascript(function(done) {
          done({nextPage: 'http://localhost:7337/resources/basic.html'});
        })
        .result(function(err, req, res) {
          count++;
        });

      phantom.run(scraper, function() {
        assert(count === 5);
        done();
      });
    });
  });

  describe('Pausing', function() {

    it('should be possible to pause the scraper.', function(done) {
      var count = 0;

      var scraper = new sandcrawler.Scraper()
        .config({limit: 3})
        .iterate(function(i, req, res) {
          return 'http://localhost:7337/resources/basic.html';
        })
        .script(__dirname + '/../resources/scrapers/basic.js')
        .result(function(err, req, res) {
          var self = this;

          count++;

          assert(err === null);
          assert.deepEqual(res.data, samples.basic);

          if (count === 2) {
            this.pause();
            setTimeout(function() {
              self.resume();
            }, 300);
          }
        });

      phantom.run(scraper, function(err, remains) {
        assert(count === 3);
        done();
      });
    });
  });

  describe('Expansion', function() {

    it('should be possible to add new jobs to the stack.', function(done) {
      var i = 0,
          count = 0,
          eventCount = 0;

      var scraper = new sandcrawler.Scraper()
        .url('http://localhost:7337/resources/basic.html')
        .script(__dirname + '/../resources/scrapers/basic.js')
        .result(function(err, req, res) {
          count++;

          assert(err === null);
          assert.deepEqual(res.data, samples.basic);

          // Expanding
          if (i < 2)
            this.addUrl('http://localhost:7337/resources/basic.html');

          i++;
        })
        .on('job:added', function(job) {
          eventCount++;
          assert.strictEqual(job.req.url, 'http://localhost:7337/resources/basic.html');
        });

      phantom.run(scraper, function(err, remains) {
        assert(count === 3);
        assert(eventCount === 2);
        done();
      });
    });
  });

  describe('Retries', function() {

    it('should be possible to retry some jobs.', function(done) {
      var eventCount = 0,
          resultCount = 0;

      var scraper = new sandcrawler.Scraper()
        .url('http://localhost:7337/retries')
        .script(__dirname + '/../resources/scrapers/basic.js')
        .result(function(err, req, res) {
          assert(typeof req.retry === 'function');
          assert(typeof req.retryLater === 'function');
          assert(typeof req.retryNow === 'function');

          resultCount++;
          if (err) req.retryLater();
        })
        .on('job:retry', function(job) {
          eventCount++;
          assert(job.req.retries === 1);
          assert.strictEqual(job.req.url, 'http://localhost:7337/retries');
        });

      phantom.run(scraper, function(err, remains) {
        assert(resultCount === 2);
        assert(eventCount === 1);
        done();
      });
    });

    it('should be possible to set a max retries parameter.', function(done) {
      var count = 0;

      var scraper = new sandcrawler.Scraper()
        .url('http://localhost:7337/404.html')
        .config({maxRetries: 2})
        .script(__dirname + '/../resources/scrapers/basic.js')
        .result(function(err, req) {
          count++;
          return req.retry();
        });

      phantom.run(scraper, function() {
        assert(count === 3);
        done();
      });
    });

    it('should be possible to use the autoRetry setting.', function(done) {
      var count = 0;

      var scraper = new sandcrawler.Scraper()
        .url('http://localhost:7337/404.html')
        .config({maxRetries: 2, autoRetry: true})
        .script(__dirname + '/../resources/scrapers/basic.js')
        .result(function(err, req) {
          count++;
        });

      phantom.run(scraper, function() {
        assert(count === 3);
        done();
      });
    });
  });

  describe('Exiting', function() {

    it('should be possible to exit the scraper.', function(done) {
      var count = 0;

      var scraper = new sandcrawler.Scraper()
        .url('http://localhost:7337/resources/basic.html')
        .jawascript(function(done) {
          done(true);
        })
        .result(function() {
          count++;
          this.exit();
        });

      phantom.run(scraper, function(err) {
        assert.strictEqual(err.message, 'exited');
        assert(count === 1);
        done();
      });
    });
  });

  after(function() {

    // Now closing the phantom
    phantom.close();
  });
});
