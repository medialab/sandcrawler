/**
 * Sandcrawler Single Url Task Tests
 * ==================================
 *
 * Basic tests where we want to scrape the content of single urls. Useful to
 * scaffold the basics of the API.
 */
var assert = require('assert'),
    sandcrawler = require('../index.js');

describe('Single Url Task', function() {
  this.timeout(3000);

  // Crawler used throughout the tests
  var crawler = null;

  // Validation data
  var simpleList = [
    'http://nicesite.com',
    'http://awesomesite.com',
    'http://prettysite.com',
    'http://unknownsite.com'
  ];

  before(function(done) {
    sandcrawler.create({}, function(err, instance) {
      crawler = instance;

      // Debug hook
      crawler.on('phantom:log', function(message) {
        console.log(message);
      });

      done();
    });
  });

  it('should be possible to scrape from a lone url.', function(done) {

    crawler
      .task('http://localhost:8001/basic.html')
      .inject(function() {

        var data = artoo.scrape('.url-list a', 'href');
        artoo.done(data);
      })
      .then(function(data) {

        assert.deepEqual(data, simpleList);
        done();
      });
  });

  it('should be possible to provide a string as the scraper.', function(done) {

    crawler
      .task('http://localhost:8001/basic.html')
      .inject("var data = artoo.scrape('.url-list a', 'href'); artoo.done(data);")
      .then(function(data) {

        assert.deepEqual(data, simpleList);
        done();
      });
  });

  it('should be possible to provide a file as the scraper.', function(done) {
    crawler
      .task('http://localhost:8001/basic.html')
      .injectScript(__dirname + '/resource/basic_scraper.js')
      .then(function(data) {

        assert.deepEqual(data, simpleList);
        done();
      });
  });

  it('should be possible to subscribe to the page log.', function(done) {

    crawler
      .task('http://localhost:8001/basic.html')
      .inject(function() {
        console.log('Hello world!');
        artoo.done();
      })
      .on('page:log', function(data) {
        assert(data.url === 'http://localhost:8001/basic.html');
      })
      .then(done);
  });

  it('should be possible to subscribe to the page errors.', function(done) {

    crawler
      .task('http://localhost:8001/basic.html')
      .config({timeout: 100})
      .inject(function() {
        throw Error('test');
      })
      .on('page:error', function(data) {
        assert(data.url === 'http://localhost:8001/basic.html');
        assert(data.message === 'Error: test');
      })
      .fail(function(err) {
        done();
      });
  });
});
