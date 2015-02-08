/**
 * Sandcrawler Multiple Spiders Tests
 * ===================================
 *
 * Testing some spiders fetching a discrete series of urls.
 */
var assert = require('assert'),
    sandcrawler = require('../../index.js'),
    samples = require('../samples.js');

var phantom;

describe('When running multi-url spiders', function() {

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

      var spider = new sandcrawler.spider()
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

      phantom.run(spider, function(err) {
        assert(count === 2);
        done();
      });
    });

    it('should be possible to increase concurrency.' , function(done) {
      var count = 0,
          check = false;

      var spider = new sandcrawler.spider()
        .urls([
          {url: 'http://localhost:7337/resources/basic.html', id: 1},
          {url: 'http://localhost:7337/resources/basic.html', id: 2},
          {url: 'http://localhost:7337/resources/basic.html', id: 3}
        ])
        .config({concurrency: 2})
        .script(__dirname + '/../resources/scrapers/basic.js')
        .result(function(err, req, res) {
          count++;

          assert(err === null);
          assert.deepEqual(res.data, samples.basic);
        });

      phantom.run(spider, function(err) {
        assert(count === 3);
        done();
      });
    });

    it('should be possible to get the remains back after the spider has been fulfilled.', function(done) {
      var count = 0;

      var spider = new sandcrawler.spider()
        .urls([
          {url: 'http://localhost:7337/resources/basic.html', id: 1},
          {url: 'http://localhost:7337/resources/basic.html', id: 2},
          {url: 'http://localhost:7337/resources/404.html', id: 3}
        ])
        .config({concurrency: 3, timeout: 300})
        .script(__dirname + '/../resources/scrapers/basic.js')
        .result(function(err, req, res) {
          count++;
        })
        .on('spider:end', function(status, remains) {
          assert.strictEqual(status, 'success');
          assert(remains.length === 1);
        });

      phantom.run(spider, function(err, remains) {
        assert(remains.length === 1);
        assert(count === 3);
        assert.strictEqual(remains[0].error.message, 'status-404');
        done();
      });
    });
  });

  describe('Iterator', function() {

    it('should be possible to use a function as iterator.', function(done) {
      var count = 0;

      var spider = new sandcrawler.spider()
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

      phantom.run(spider, function() {
        assert(count === 3);
        done();
      });
    });

    it('should be possible to set a limit to the iterator.', function(done) {
      var count = 0;

      var spider = new sandcrawler.spider()
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

      phantom.run(spider, function() {
        assert(count === 3);
        done();
      });
    });

    it('should be possible to use the limit shorthand.', function(done) {
      var count = 0;

      var spider = new sandcrawler.spider()
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

      phantom.run(spider, function() {
        assert(count === 3);
        done();
      });
    });

    it('should be possible to start from a single url.', function(done) {
      var count = 0;

      var spider = new sandcrawler.spider()
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

      phantom.run(spider, function() {
        assert(count === 3);
        done();
      });
    });

    it('should be possible to start from a list of urls.', function(done) {
      var count = 0;

      var spider = new sandcrawler.spider()
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

      phantom.run(spider, function() {
        assert(count === 5);
        done();
      });
    });
  });

  describe('Pausing', function() {

    it('should be possible to pause the spider.', function(done) {
      var count = 0;

      var spider = new sandcrawler.spider()
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

      phantom.run(spider, function(err, remains) {
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

      var spider = new sandcrawler.spider()
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
        .on('job:add', function(job) {
          eventCount++;
          assert.strictEqual(job.req.url, 'http://localhost:7337/resources/basic.html');
        });

      phantom.run(spider, function(err, remains) {
        assert(count === 3);
        assert(eventCount === 2);
        done();
      });
    });
  });

  describe('Discards', function() {

    it('should be possible to discard some jobs before they are executed.', function(done) {
      var count = 0,
          discardedCount = 0;

      var spider = new sandcrawler.spider()
        .urls([
          'http://localhost:7337/resources/basic.html',
          'http://localhost:7337/resources/basic.html',
          'http://localhost:7337/resources/basic.html',
          'http://localhost:7337/resources/basic.html'
        ])
        .script(__dirname + '/../resources/scrapers/basic.js')
        .beforeScraping(function(req, next) {
          if (this.index > 1)
            return next(new Error('too-far'));
          next(null);
        })
        .on('job:discard', function(err, job) {
          assert.strictEqual(err.message, 'too-far');
          discardedCount++;
        })
        .result(function(err, req, res) {
          count++;
        });

      phantom.run(spider, function(err, remains) {
        assert.strictEqual(remains.length, 0);
        assert.strictEqual(count, 2);
        assert.strictEqual(discardedCount, 2);
        done();
      });
    });
  });

  describe('Retries', function() {

    it('should be possible to retry some jobs.', function(done) {
      var eventCount = 0,
          resultCount = 0;

      var spider = new sandcrawler.spider()
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

      phantom.run(spider, function(err, remains) {
        assert(resultCount === 2);
        assert(eventCount === 1);
        done();
      });
    });

    it('should be possible to set a max retries parameter.', function(done) {
      var count = 0;

      var spider = new sandcrawler.spider()
        .url('http://localhost:7337/404.html')
        .config({maxRetries: 2})
        .script(__dirname + '/../resources/scrapers/basic.js')
        .result(function(err, req) {
          count++;
          return req.retry();
        });

      phantom.run(spider, function() {
        assert(count === 3);
        done();
      });
    });

    it('should be possible to use the autoRetry setting.', function(done) {
      var count = 0;

      var spider = new sandcrawler.spider()
        .url('http://localhost:7337/404.html')
        .config({maxRetries: 2, autoRetry: true})
        .script(__dirname + '/../resources/scrapers/basic.js')
        .result(function(err, req) {
          count++;
        });

      phantom.run(spider, function() {
        assert(count === 3);
        done();
      });
    });
  });

  Function.prototype('Exiting', function() {

    it('should be possible to exit the spider.', function(done) {
      var count = 0;

      var spider = new sandcrawler.spider()
        .url([
          {url: 'http://localhost:7337/resources/basic.html', id: 0},
          {url: 'http://localhost:7337/resources/basic.html', id: 1},
          {url: 'http://localhost:7337/resources/basic.html', id: 2}
        ])
        .jawascript(function(done) {
          done(true);
        })
        .result(function() {
          count++;
          this.exit();
        });

      phantom.run(spider, function(err, remains) {
        assert.strictEqual(err.message, 'exited');
        assert(count === 1);
        assert(remains.length === 2);
        assert.strictEqual(remains[0].job.id, 1);
        assert.strictEqual(remains[0].error.message, 'exited');
        done();
      });
    });
  });

  after(function() {

    // Now closing the phantom
    phantom.close();
  });
});
