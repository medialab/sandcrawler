/**
 * Sandcrawler Simple Spiders Tests
 * ==================================
 *
 * Testing some simple spiders use cases.
 */
var assert = require('assert'),
    async = require('async'),
    sandcrawler = require('../../index.js'),
    validate = require('../../src/plugins/validate.js'),
    samples = require('../samples.js');

var phantom;

describe('When running fairly simple spiders', function() {
  this.timeout(3000);

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

      // Creating the spider
      var spider = sandcrawler.phantomSpider()
        .url('http://localhost:7337/resources/basic.html')
        .scraper(require('../resources/scrapers/basic.js'))
        .result(function(err, req, res) {
          assert.deepEqual(res.data, samples.basic);
        });

      // Running the spider
      sandcrawler.run(spider, function(err) {
        assert(err === null);
        done();
      });
    });

    it('should be possible to use a result variant using both a callback and an errback.', function(done) {
      var count = 0;

      var spider = sandcrawler.phantomSpider()
        .urls([
          'http://localhost:7337/resources/basic.html',
          'http://localhost:7337/resources/404.html'
        ])
        .scraper(require('../resources/scrapers/basic.js'))
        .result(
          function(req, res) {
            assert.deepEqual(res.data, samples.basic);
            count++;
          },
          function(err) {
            assert.strictEqual(err.message, 'status-404');
            count++;
          }
        );

      sandcrawler.run(spider, function(err) {
        assert(err === null);
        assert(count === 2);
        done();
      });
    });

    it('should be possible to use a synchronous scraper.', function(done) {
      var spider = sandcrawler.phantomSpider()
        .url('http://localhost:7337/resources/basic.html')
        .scraperSync(function($) {
          return $('.url-list a').scrape('href');
        })
        .result(function(err, req, res) {
          assert.deepEqual(res.data, samples.basic);
        });

      // Running the spider
      phantom.run(spider, function(err) {
        assert(err === null);
        done();
      });
    });

    it('should be possible to get json/non-HTML pages.', function(done) {
      var count = 0;

      var spider = sandcrawler.phantomSpider()
        .url('http://localhost:7337/json')
        .result(function(err, req, res) {

          assert.deepEqual(res.body, {hello: 'world'});
          count++;
        });

      phantom.run(spider, function(err, remains) {
        assert(err === null);
        assert(count === 1);
        done();
      });
    });
  });

  describe('Event subscription', function() {

    it('should be possible to subscribe to page log.', function(done) {

      var spider = sandcrawler.phantomSpider()
        .url('http://localhost:7337/resources/basic.html')
        .scraper(require('../resources/scrapers/logger.js'))
        .on('page:log', function(data, req, res) {
          assert.strictEqual(req.url, 'http://localhost:7337/resources/basic.html');
          assert.strictEqual(data.message, 'Hello world!');
        });

      phantom.run(spider, done);
    });

    it('should be possible to subscribe to page errors.', function(done) {

      var spider = sandcrawler.phantomSpider()
        .url('http://localhost:7337/resources/basic.html')
        .config({timeout: 300})
        .scraper(require('../resources/scrapers/error.js'), false)
        .on('page:error', function(data) {
          assert.strictEqual(data.message, 'Error: random-error');
        });

      phantom.run(spider, done);
    });

    it('should be possible to subscribe to page alerts.', function(done) {

      var spider = sandcrawler.phantomSpider()
        .url('http://localhost:7337/resources/basic.html')
        .scraper(require('../resources/scrapers/alert.js'))
        .on('page:alert', function(data) {
          assert.strictEqual(data.message, 'Hello world!');
        });

      phantom.run(spider, done);
    });

    it('should be possible to handle page navigation.', function(done) {
      var spider = sandcrawler.phantomSpider()
        .url('http://localhost:7337/resources/basic.html')
        .scraper(require('../resources/scrapers/changer.js'), false)
        .on('page:navigation', function(navigation) {
          navigation.replyWithScraper(function($, done) {
            return done(null, $('title').text());
          });
        })
        .result(function(err, req, res) {
          assert.strictEqual(res.data, 'Basic 2');
          assert.strictEqual(res.url, 'http://localhost:7337/resources/basic2.html');
        });

      phantom.run(spider, done);
    });
  });

  describe('Error handling', function() {
    var globalSpider = sandcrawler.phantomSpider()
        .url('http://localhost:7337/resources/basic.html')
        .timeout(200)
        .scraper(require('../resources/scrapers/waiter.js'), false)
        .result(function(err) {
          assert.strictEqual(err.message, 'timeout');
        });

    it('should timeout correctly.', function(done) {
      phantom.run(globalSpider, done);
    });

    it('should throw an error when running a fulfilled spider.', function() {

      assert.throws(function() {
        sandcrawler.run(globalSpider);
      }, /fulfilled/);

      assert.throws(function() {
        phantom.run(globalSpider);
      }, /fulfilled/);
    });

    it('should dispatch an error when phantom failed to grasp the page.', function(done) {
      var spider = sandcrawler.phantomSpider()
        .url('inexistantpage.html')
        .scraper(require('../resources/scrapers/logger.js'))
        .result(function(err, req, res) {
          assert.strictEqual(err.message, 'content-not-found');
        });

      phantom.run(spider, done);
    });

    it('should dispatch an error when the page status is not correct.', function(done) {
      var spider = sandcrawler.phantomSpider()
        .url('http://localhost:7337/resources/404.html')
        .scraper(require('../resources/scrapers/logger.js'))
        .result(function(err, req, res) {
          assert.strictEqual(err.message, 'status-404');
        });

      phantom.run(spider, done);
    });

    it('should be possible to get back user-generated errors.', function(done) {
      var spider = sandcrawler.phantomSpider()
        .url('http://localhost:7337/resources/basic.html')
        .scraper(require('../resources/scrapers/user_error.js'))
        .result(function(err, req, res) {
          assert.strictEqual(err.message, 'tada');
        });

      phantom.run(spider, done);
    });
  });

  describe('Jawascript', function() {

    it('should be possible to run some jawascript from a function.', function(done) {

      var spider = sandcrawler.phantomSpider()
        .url('http://localhost:7337/resources/basic.html')
        .scraper(function($, done) {
          artoo.done(null, artoo.scrape('.url-list a', 'href'));
        })
        .result(function(err, req, res) {
          assert.deepEqual(res.data, samples.basic);
        });

      phantom.run(spider, done);
    });

    it('should be possible to change the name of the given arguments.', function(done) {
      var spider = sandcrawler.phantomSpider()
        .url('http://localhost:7337/resources/basic.html')
        .scraper(function(dollar, next) {
          return next(null, dollar('.url-list a').scrape('href'));
        })
        .result(function(err, req, res) {
          assert.deepEqual(res.data, samples.basic);
        });

      phantom.run(spider, done);
    });

    it('should be possible to notify phantom with done.', function(done) {

      var spider = sandcrawler.phantomSpider()
        .url('http://localhost:7337/resources/basic.html')
        .scraper(function($, done) {
          var data = artoo.scrape('.url-list a', 'href');
          done(null, data);
        })
        .result(function(err, req, res) {
          assert.deepEqual(res.data, samples.basic);
        });

      phantom.run(spider, done);
    });

    it('should be possible to load an inline scraper.', function(done) {
      var spider = sandcrawler.phantomSpider()
        .url('http://localhost:7337/resources/basic.html')
        .inlineScraper('var data = artoo.scrape(\'.url-list a\', \'href\'); done(null, data);')
        .result(function(err, req, res) {
          assert.deepEqual(res.data, samples.basic);
        });

      phantom.run(spider, done);
    });

    it('should be possible to load an inline synchronous scraper.', function(done) {
      var spider = sandcrawler.phantomSpider()
        .url('http://localhost:7337/resources/basic.html')
        .inlineScraperSync('return artoo.scrape(\'.url-list a\', \'href\');')
        .result(function(err, req, res) {
          assert.deepEqual(res.data, samples.basic);
        });

      phantom.run(spider, done);
    });
  });

  describe('jQuery', function() {

    it('should be possible to inject jQuery without breaking the page.', function(done) {
      var spider = sandcrawler.phantomSpider()
        .url('http://localhost:7337/resources/jquery.html')
        .scraper(function($, done) {
          var data = {
            fromDollar: window.$,
            fromArtoo: $('p').scrapeOne()
          };
          return done(null, data);
        })
        .result(function(err, req, res) {
          assert.deepEqual(res.data, {
            fromDollar: 'hello',
            fromArtoo: 'welcome'
          });
        });

      phantom.run(spider, done);
    });
  });

  describe('Plugins', function() {

    it('should be possible to use a plugin.', function(done) {

      var spider = sandcrawler.phantomSpider()
        .url('http://localhost:7337/resources/basic.html')
        .scraper(require('../resources/scrapers/basic.js'))
        .use(validate('array'))
        .result(function(err, req, res) {
          assert(err === null);
          assert.deepEqual(res.data, samples.basic);
        });

      phantom.run(spider, done);
    });
  });

  describe('Feed', function() {

    it('should be possible to set arbitrary data to jobs.', function(done) {
      var spider = sandcrawler.phantomSpider()
        .url({
          url: 'http://localhost:7337/resources/basic.html',
          data: {
            ok: true
          }
        })
        .scraper(require('../resources/scrapers/basic.js'))
        .beforeScraping(function(req, next) {
          assert(req.data.ok);
          req.data.hello = 'world';
          next();
        })
        .afterScraping(function(req, res, next) {
          assert.strictEqual(req.data.hello, 'world');
          next();
        });

        phantom.run(spider, done);
    });

    it('should be possible to pass an url object to parse as a job.', function(done) {
      var spider = sandcrawler.phantomSpider()
        .url({hostname: 'localhost', port: '7337', protocol: 'http', pathname: 'resources/basic.html'})
        .scraper(require('../resources/scrapers/basic.js'))
        .result(function(err, req, res) {
          assert(err === null);
          assert.deepEqual(res.data, samples.basic);
        });

        phantom.run(spider, done);
    });

    it('should be possible to pass an url object to parse as a job with default http protocol.', function(done) {
      var spider = sandcrawler.phantomSpider()
        .url({hostname: 'localhost', port: '7337', pathname: 'resources/basic.html'})
        .scraper(require('../resources/scrapers/basic.js'))
        .result(function(err, req, res) {
          assert(err === null);
          assert.deepEqual(res.data, samples.basic);
        });

        phantom.run(spider, done);
    });

    it('should be possible to pass an url object under `url` to parse as a job.', function(done) {
      var spider = sandcrawler.phantomSpider()
        .url({url: {hostname: 'localhost', port: '7337', protocol: 'http', pathname: 'resources/basic.html'}})
        .scraper(require('../resources/scrapers/basic.js'))
        .result(function(err, req, res) {
          assert(err === null);
          assert.deepEqual(res.data, samples.basic);
        });

        phantom.run(spider, done);
    });
  });

  describe('Data validation', function() {

    it('should be possible to validate data with a function.', function(done) {

      var spider = sandcrawler.phantomSpider()
        .url('http://localhost:7337/resources/basic.html')
        .scraper(require('../resources/scrapers/basic.js'))
        .validate(function(data) {
          return data instanceof Array;
        })
        .result(function(err, req, res) {
          assert(err === null);
          assert.deepEqual(res.data, samples.basic);
        });

      phantom.run(spider, done);
    });

    it('should be possible to validate data with a type.', function(done) {

      var spider = sandcrawler.phantomSpider()
        .url('http://localhost:7337/resources/basic.html')
        .scraper(require('../resources/scrapers/basic.js'))
        .validate('array')
        .result(function(err, req, res) {
          assert(err === null);
          assert.deepEqual(res.data, samples.basic);
        });

      phantom.run(spider, done);
    });

    it('should fail the job whenever validation fails.', function(done) {

      var spider = sandcrawler.phantomSpider()
        .url('http://localhost:7337/resources/basic.html')
        .scraper(require('../resources/scrapers/basic.js'))
        .validate('?string')
        .result(function(err, req, res) {
          assert.strictEqual(err.message, 'invalid-data');
        });

      phantom.run(spider, done);
    });
  });

  describe('Page customization', function(done) {

    it('should be possible to use other http verbs than GET.', function(done) {

      async.series({
        config: function(next) {
          var spider = sandcrawler.phantomSpider()
            .url('http://localhost:7337/method')
            .config({method: 'POST'})
            .scraper(function($, done) {
              done(null, $('body').scrapeOne());
            })
            .result(function(err, req, res) {
              assert.strictEqual(res.data, 'Yay!');
            });

          phantom.run(spider, next);
        },
        feed: function(next) {
          var spider = sandcrawler.phantomSpider()
            .url({url: 'http://localhost:7337/method', method: 'POST'})
            .scraper(function($, done) {
              done(null, $('body').scrapeOne());
            })
            .result(function(err, req, res) {
              assert.strictEqual(res.data, 'Yay!');
            });

          phantom.run(spider, next);
        }
      }, done);
    });

    it('should be possible to set your own user agent.', function(done) {

      async.series({
        config: function(next) {
          var spider = sandcrawler.phantomSpider()
            .url('http://localhost:7337/useragent')
            .config({headers: {'User-Agent': 'tada'}})
            .scraper(function($, done) {
              done(null, $('body').scrapeOne());
            })
            .result(function(err, req, res) {
              assert.strictEqual(res.data, 'Yay!');
            });

          phantom.run(spider, next);
        },
        feed: function(next) {
          var spider = sandcrawler.phantomSpider()
            .url({url: 'http://localhost:7337/useragent', headers: {'User-Agent': 'tada'}})
            .scraper(function($, done) {
              done(null, $('body').scrapeOne());
            })
            .result(function(err, req, res) {
              assert.strictEqual(res.data, 'Yay!');
            });

          phantom.run(spider, next);
        }
      }, done);
    });

    it('should be possible to set your own headers.', function(done) {

      async.series({
        config: function(next) {
          var spider = sandcrawler.phantomSpider()
            .url('http://localhost:7337/headers')
            .config({headers: {'x-tada': 'valid'}})
            .scraper(function($, done) {
              done(null, $('body').scrapeOne());
            })
            .result(function(err, req, res) {
              assert.strictEqual(res.data, 'Yay!');
            });

          phantom.run(spider, next);
        },
        feed: function(next) {
          var spider = sandcrawler.phantomSpider()
            .url({url: 'http://localhost:7337/headers', headers: {'x-tada': 'valid'}})
            .scraper(function($, done) {
              done(null, $('body').scrapeOne());
            })
            .result(function(err, req, res) {
              assert.strictEqual(res.data, 'Yay!');
            });

          phantom.run(spider, next);
        }
      }, done);
    });

    it('should be possible to use http authentication.', function(done) {

      async.series({
        config: function(next) {
          var spider = sandcrawler.phantomSpider()
            .url('http://localhost:7337/auth')
            .config({auth: {user: 'admin', password: 'password'}})
            .scraper(function($, done) {
              done(null, $('body').scrapeOne());
            })
            .result(function(err, req, res) {
              assert.strictEqual(res.data, 'Yay!');
            });

          phantom.run(spider, next);
        },
        feed: function(next) {
          var spider = sandcrawler.phantomSpider()
            .url({url: 'http://localhost:7337/auth', auth: {user: 'admin', password: 'password'}})
            .scraper(function($, done) {
              done(null, $('body').scrapeOne());
            })
            .result(function(err, req, res) {
              assert.strictEqual(res.data, 'Yay!');
            });

          phantom.run(spider, next);
        }
      }, done);
    });

    it('should be possible to send urlencoded data.', function(done) {

      async.series({
        config: function(next) {
          var spider = sandcrawler.phantomSpider()
            .url('http://localhost:7337/urlencoded')
            .config({method: 'POST', bodyType: 'form', body: {pass: 'test'}})
            .scraper(function($, done) {
              done(null, $('body').scrapeOne());
            })
            .result(function(err, req, res) {
              assert.strictEqual(res.data, 'Yay!');
            });

          phantom.run(spider, next);
        },
        feed: function(next) {
          var spider = sandcrawler.phantomSpider()
            .url({url: 'http://localhost:7337/urlencoded', method: 'POST', bodyType: 'form', body: {pass: 'test'}})
            .scraper(function($, done) {
              done(null, $('body').scrapeOne());
            })
            .result(function(err, req, res) {
              assert.strictEqual(res.data, 'Yay!');
            });

          phantom.run(spider, next);
        },
        text: function(next) {
          var spider = sandcrawler.phantomSpider()
            .url({url: 'http://localhost:7337/urlencoded', method: 'POST', body: 'pass=test'})
            .scraper(function($, done) {
              done(null, $('body').scrapeOne());
            })
            .result(function(err, req, res) {
              assert.strictEqual(res.data, 'Yay!');
            });

          phantom.run(spider, next);
        }
      }, done);
    });

    it('should be possible to send json data.', function(done) {

      async.series({
        config: function(next) {
          var spider = sandcrawler.phantomSpider()
            .url('http://localhost:7337/json')
            .config({method: 'POST', bodyType: 'json', body: {pass: 'test'}})
            .scraper(function($, done) {
              done(null, $('body').scrapeOne());
            })
            .result(function(err, req, res) {
              assert.strictEqual(res.data, 'Yay!');
            });

          phantom.run(spider, next);
        },
        feed: function(next) {
          var spider = sandcrawler.phantomSpider()
            .url({url: 'http://localhost:7337/json', method: 'POST', bodyType: 'json', body: {pass: 'test'}})
            .scraper(function($, done) {
              done(null, $('body').scrapeOne());
            })
            .result(function(err, req, res) {
              assert.strictEqual(res.data, 'Yay!');
            });

          phantom.run(spider, next);
        },
        text: function(next) {
          var spider = sandcrawler.phantomSpider()
            .url({url: 'http://localhost:7337/json', method: 'POST', bodyType: 'json', body: '{"pass": "test"}'})
            .scraper(function($, done) {
              done(null, $('body').scrapeOne());
            })
            .result(function(err, req, res) {
              assert.strictEqual(res.data, 'Yay!');
            });

          phantom.run(spider, next);
        }
      }, done);
    });

    it('should be possible to indicate source encoding.', function(done) {

      async.series({
        config: function(next) {
          var spider = sandcrawler.phantomSpider()
            .url('http://localhost:7337/iso')
            // .config({encoding: 'iso-8859-1'})
            .scraper(require('../resources/scrapers/iso.js'))
            .result(function(err, req, res) {
              assert.deepEqual(res.data, samples.iso);
            });

          phantom.run(spider, next);
        },
        feed: function(next) {
          var spider = sandcrawler.phantomSpider()
            .url({url: 'http://localhost:7337/iso'})
            .scraper(require('../resources/scrapers/iso.js'))
            .result(function(err, req, res) {
              assert.deepEqual(res.data, samples.iso);
            });

          phantom.run(spider, next);
        }
      }, done);
    });

    it('should be possible to change phantom page\'s settings.', function(done) {

      async.series({
        config: function(next) {
          var spider = sandcrawler.phantomSpider()
            .url('http://localhost:7337/resources/basic.html')
            .config({phantomPage: {javascriptEnabled: false}})
            .timeout(100)
            .scraper(function($, done) {
              done(null, $('body').scrapeOne());
            })
            .result(function(err, req, res) {
              assert.strictEqual(err.message, 'timeout');
            });

          phantom.run(spider, next);
        },
        feed: function(next) {
          var spider = sandcrawler.phantomSpider()
            .url({url: 'http://localhost:7337/resources/basic.html', phantomPage: {javascriptEnabled: false}})
            .timeout(100)
            .scraper(function($, done) {
              done(null, $('body').scrapeOne());
            })
            .result(function(err, req, res) {
              assert.strictEqual(err.message, 'timeout');
            });

          phantom.run(spider, next);
        }
      }, done);
    });

    it('should be possible to change artoo\'s settings', function(done) {

      async.series({
        config: function(next) {
          var spider = sandcrawler.phantomSpider()
            .url('http://localhost:7337/resources/basic.html')
            .config({artoo: {log: {enabled: true, welcome: false}}})
            .timeout(100)
            .scraper(function($, done) {
              artoo.log('hello');
              done(null, $('body').scrapeOne());
            })
            .on('page:log', function(data) {
              assert(!!~data.message.indexOf('artoo'));
            });

          phantom.run(spider, next);
        },
        feed: function(next) {
          var spider = sandcrawler.phantomSpider()
            .url({url: 'http://localhost:7337/resources/basic.html', artoo: {log: {enabled: true}}})
            .timeout(100)
            .scraper(function($, done) {
              artoo.log('hello');
              done(null, $('body').scrapeOne());
            })
            .on('page:log', function(data) {
              assert(!!~data.message.indexOf('artoo'));
            });

          phantom.run(spider, next);
        }
      }, done);
    });
  });
});
