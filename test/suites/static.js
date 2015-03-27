/**
 * Sandcrawler Static Spiders Tests
 * ==================================
 *
 * Testing a spiders using static requests.
 */
var assert = require('assert'),
    async = require('async'),
    sandcrawler = require('../../index.js'),
    samples = require('../samples.js');

describe('When running a static spider', function() {

  describe('Simple use cases', function() {

    it('should work correctly.', function(done) {

      // Creating the spider
      var spider = sandcrawler.spider()
        .url('http://localhost:7337/resources/basic.html')
        .scraper(function($, done) {
          done(null, $('.url-list a').scrape('href'));
        })
        .result(function(err, req, res) {
          assert(err === null);
          assert.deepEqual(res.data, samples.basic);
        });

      sandcrawler.run(spider, done);
    });

    it('should work with synchronous scrapers.', function(done) {
      sandcrawler.spider()
        .url('http://localhost:7337/resources/basic.html')
        .scraperSync(function($) {
          return $('.url-list a').scrape('href');
        })
        .result(function(err, req, res) {
          assert(err === null);
          assert.deepEqual(res.data, samples.basic);
        })
        .run(function(err, remains) {
          assert(err === null);
          assert(remains.length === 0);
          done();
        });
    });

    it('should be possible to get json or non-HTML pages.', function(done) {
      var count = 0;

      sandcrawler.spider()
        .url('http://localhost:7337/json')
        .result(function(err, req, res) {
          assert.deepEqual(res.body, {hello: 'world'});
          count++;
        })
        .run(function(err, remains) {
          assert(err === null);
          assert(count === 1);
          done();
        });
    });

    it('should be possible to access the context.', function(done) {
      var spider = sandcrawler.spider()
        .url('http://localhost:7337/resources/basic.html')
        .scraper(function($, done, job) {
          assert.strictEqual(job.req.url, 'http://localhost:7337/resources/basic.html');
          return done(null, $('.url-list a').scrape('href'));
        })
        .result(function(err, req, res) {
          assert(err === null);
          assert.deepEqual(res.data, samples.basic);
        });

      sandcrawler.run(spider, done);
    });
  });

  describe('Page customization', function(done) {

    it('should be possible to use other http verbs than GET.', function(done) {

      async.series({
        config: function(next) {
          var spider = sandcrawler.spider()
            .url('http://localhost:7337/method')
            .config({method: 'POST'})
            .scraper(function($, done) {
              done(null, $('body').scrapeOne());
            })
            .result(function(err, req, res) {
              assert.strictEqual(res.data, 'Yay!');
            });

          sandcrawler.run(spider, next);
        },
        feed: function(next) {
          var spider = sandcrawler.spider()
            .url({url: 'http://localhost:7337/method', method: 'POST'})
            .scraper(function($, done) {
              done(null, $('body').scrapeOne());
            })
            .result(function(err, req, res) {
              assert.strictEqual(res.data, 'Yay!');
            });

          sandcrawler.run(spider, next);
        }
      }, done);
    });

    it('should be possible to set your own user agent.', function(done) {

      async.series({
        config: function(next) {
          var spider = sandcrawler.spider()
            .url('http://localhost:7337/useragent')
            .config({headers: {'User-Agent': 'tada'}})
            .scraper(function($, done) {
              done(null, $('body').scrapeOne());
            })
            .result(function(err, req, res) {
              assert.strictEqual(res.data, 'Yay!');
            });

          sandcrawler.run(spider, next);
        },
        feed: function(next) {
          var spider = sandcrawler.spider()
            .url({url: 'http://localhost:7337/useragent', headers: {'User-Agent': 'tada'}})
            .scraper(function($, done) {
              done(null, $('body').scrapeOne());
            })
            .result(function(err, req, res) {
              assert.strictEqual(res.data, 'Yay!');
            });

          sandcrawler.run(spider, next);
        }
      }, done);
    });

    it('should be possible to set your own headers.', function(done) {

      async.series({
        config: function(next) {
          var spider = sandcrawler.spider()
            .url('http://localhost:7337/headers')
            .config({headers: {'x-tada': 'valid'}})
            .scraper(function($, done) {
              done(null, $('body').scrapeOne());
            })
            .result(function(err, req, res) {
              assert.strictEqual(res.data, 'Yay!');
            });

          sandcrawler.run(spider, next);
        },
        feed: function(next) {
          var spider = sandcrawler.spider()
            .url({url: 'http://localhost:7337/headers', headers: {'x-tada': 'valid'}})
            .scraper(function($, done) {
              done(null, $('body').scrapeOne());
            })
            .result(function(err, req, res) {
              assert.strictEqual(res.data, 'Yay!');
            });

          sandcrawler.run(spider, next);
        }
      }, done);
    });

    it('should be possible to use http authentication.', function(done) {

      async.series({
        config: function(next) {
          var spider = sandcrawler.spider()
            .url('http://localhost:7337/auth')
            .config({auth: {user: 'admin', password: 'password'}})
            .scraper(function($, done) {
              done(null, $('body').scrapeOne());
            })
            .result(function(err, req, res) {
              assert.strictEqual(res.data, 'Yay!');
            });

          sandcrawler.run(spider, next);
        },
        feed: function(next) {
          var spider = sandcrawler.spider()
            .url({url: 'http://localhost:7337/auth', auth: {user: 'admin', password: 'password'}})
            .scraper(function($, done) {
              done(null, $('body').scrapeOne());
            })
            .result(function(err, req, res) {
              assert.strictEqual(res.data, 'Yay!');
            });

          sandcrawler.run(spider, next);
        }
      }, done);
    });

    it('should be possible to send urlencoded data.', function(done) {

      async.series({
        config: function(next) {
          var spider = sandcrawler.spider()
            .url('http://localhost:7337/urlencoded')
            .config({method: 'POST', bodyType: 'form', body: {pass: 'test'}})
            .scraper(function($, done) {
              done(null, $('body').scrapeOne());
            })
            .result(function(err, req, res) {
              assert.strictEqual(res.data, 'Yay!');
            });

          sandcrawler.run(spider, next);
        },
        feed: function(next) {
          var spider = sandcrawler.spider()
            .url({url: 'http://localhost:7337/urlencoded', method: 'POST', bodyType: 'form', body: {pass: 'test'}})
            .scraper(function($, done) {
              done(null, $('body').scrapeOne());
            })
            .result(function(err, req, res) {
              assert.strictEqual(res.data, 'Yay!');
            });

          sandcrawler.run(spider, next);
        },
        text: function(next) {
          var spider = sandcrawler.spider()
            .url({url: 'http://localhost:7337/urlencoded', method: 'POST', body: 'pass=test'})
            .scraper(function($, done) {
              done(null, $('body').scrapeOne());
            })
            .result(function(err, req, res) {
              assert.strictEqual(res.data, 'Yay!');
            });

          sandcrawler.run(spider, next);
        }
      }, done);
    });

    it('should be possible to send json data.', function(done) {

      async.series({
        config: function(next) {
          var spider = sandcrawler.spider()
            .url('http://localhost:7337/json')
            .config({method: 'POST', bodyType: 'json', body: {pass: 'test'}})
            .scraper(function($, done) {
              done(null, $('body').scrapeOne());
            })
            .result(function(err, req, res) {
              assert.strictEqual(res.data, 'Yay!');
            });

          sandcrawler.run(spider, next);
        },
        feed: function(next) {
          var spider = sandcrawler.spider()
            .url({url: 'http://localhost:7337/json', method: 'POST', bodyType: 'json', body: {pass: 'test'}})
            .scraper(function($, done) {
              done(null, $('body').scrapeOne());
            })
            .result(function(err, req, res) {
              assert.strictEqual(res.data, 'Yay!');
            });

          sandcrawler.run(spider, next);
        },
        text: function(next) {
          var spider = sandcrawler.spider()
            .url({url: 'http://localhost:7337/json', method: 'POST', bodyType: 'json', body: '{"pass": "test"}'})
            .scraper(function($, done) {
              done(null, $('body').scrapeOne());
            })
            .result(function(err, req, res) {
              assert.strictEqual(res.data, 'Yay!');
            });

          sandcrawler.run(spider, next);
        }
      }, done);
    });

    it('should be possible to indicate source encoding.', function(done) {

      async.series({
        config: function(next) {
          var spider = sandcrawler.spider()
            .url('http://localhost:7337/resources/iso.html')
            .config({encoding: 'iso-8859-1'})
            .scraper(require('../resources/scrapers/iso.js'))
            .result(function(err, req, res) {
              assert.deepEqual(res.data, samples.iso);
            });

          sandcrawler.run(spider, next);
        },
        feed: function(next) {
          var spider = sandcrawler.spider()
            .url({url: 'http://localhost:7337/resources/iso.html', encoding: 'iso-8859-1'})
            .scraper(require('../resources/scrapers/iso.js'))
            .result(function(err, req, res) {
              assert.deepEqual(res.data, samples.iso);
            });

          sandcrawler.run(spider, next);
        },
        guess: function(next) {
          var spider = sandcrawler.spider()
            .url({url: 'http://localhost:7337/iso'})
            .scraper(require('../resources/scrapers/iso.js'))
            .result(function(err, req, res) {
              assert.deepEqual(res.data, samples.iso);
            });

          sandcrawler.run(spider, next);
        }
      }, done);
    });
  });

  describe('Cookies', function() {

    it('should be possible to use a cookie jar.', function(done) {
      var spider = sandcrawler.spider()
        .urls([
          'http://localhost:7337/set-cookie',
          'http://localhost:7337/check-cookie'
        ])
        .config({jar: true})
        .scraper(function($, done) {
          done(null, $('body').text());
        })
        .result(function(err, req, res) {
          assert.strictEqual(res.data, 'Yay!');
        });

      sandcrawler.run(spider, done);
    });

    it('should be possible to use a cookie jar file storage.', function(done) {
      var spider = sandcrawler.spider()
        .urls([
          'http://localhost:7337/set-cookie',
          'http://localhost:7337/check-cookie'
        ])
        .config({jar: __dirname + '/../.tmp/cookies.json'})
        .scraper(function($, done) {
          done(null, $('body').text());
        })
        .result(function(err, req, res) {
          assert.strictEqual(res.data, 'Yay!');
        });

      sandcrawler.run(spider, done);
    });

    it('should be able to restart from a saved jar.', function(done) {
      var spider = sandcrawler.spider()
        .url('http://localhost:7337/check-cookie')
        .config({jar: __dirname + '/../.tmp/cookies.json'})
        .scraper(function($, done) {
          done(null, $('body').text());
        })
        .result(function(err, req, res) {
          assert.strictEqual(res.data, 'Yay!');
        });

      sandcrawler.run(spider, done);
    });

    it('should be able to send a specific set of cookies.', function(done) {
      async.series({
        configString: function(next) {
          var spider = sandcrawler.spider()
            .url('http://localhost:7337/check-cookie')
            .config({cookies: ['hello=world']})
            .scraper(function($, done) {
              done(null, $('body').text());
            })
            .result(function(err, req, res) {
              assert.strictEqual(res.data, 'Yay!');
            });

          sandcrawler.run(spider, next);
        },
        configObject: function(next) {
          var spider = sandcrawler.spider()
            .url('http://localhost:7337/check-cookie')
            .config({cookies: [{key: 'hello', value: 'world'}]})
            .scraper(function($, done) {
              done(null, $('body').text());
            })
            .result(function(err, req, res) {
              assert.strictEqual(res.data, 'Yay!');
            });

          sandcrawler.run(spider, next);
        },
        jobString: function(next) {
          var spider = sandcrawler.spider()
            .url({url: 'http://localhost:7337/check-cookie', cookies: ['hello=world']})
            .scraper(function($, done) {
              done(null, $('body').text());
            })
            .result(function(err, req, res) {
              assert.strictEqual(res.data, 'Yay!');
            });

          sandcrawler.run(spider, next);
        },
        jobObject: function(next) {
          var spider = sandcrawler.spider()
            .url({url: 'http://localhost:7337/check-cookie', cookies: [{key: 'hello', value: 'world'}]})
            .scraper(function($, done) {
              done(null, $('body').text());
            })
            .result(function(err, req, res) {
              assert.strictEqual(res.data, 'Yay!');
            });

          sandcrawler.run(spider, next);
        }
      }, done);
    });
  });

  describe('Error handling', function() {

    it('should handle status 404.', function(done) {

      var spider = sandcrawler.spider()
        .url('http://localhost:7337/resources/404.html')
        .scraper(function($, done) {
          done(null, $('.url-list a').scrape('href'));
        })
        .result(function(err, req, res) {
          assert.strictEqual(err.message, 'status-404');
          assert.strictEqual(err.status, 404);
        });

      sandcrawler.run(spider, done);
    });

    it('should handle user-generated errors.', function(done) {

      var spider = sandcrawler.spider()
        .url('http://localhost:7337/resources/basic.html')
        .scraper(function($, done) {
          return done(new Error('tada'));
        })
        .result(function(err, req, res) {
          assert.strictEqual(err.message, 'tada');
        });

      sandcrawler.run(spider, done);
    });

    it('should wrap scrapers in a try-catch statement.', function(done) {
      var spider = sandcrawler.spider()
        .url('http://localhost:7337/resources/basic.html')
        .scraper(function($, done) {
          throw Error('tada');
        })
        .result(function(err, req, res) {
          assert.strictEqual(err.message, 'tada');
        });

      sandcrawler.run(spider, done);
    });

    it('should wrap synchronous scrapers in a try-catch statement.', function(done) {
      var spider = sandcrawler.spider()
        .url('http://localhost:7337/resources/basic.html')
        .scraperSync(function($, done) {
          throw Error('tada');
        })
        .result(function(err, req, res) {
          assert.strictEqual(err.message, 'tada');
        });

      sandcrawler.run(spider, done);
    });
  });
});
