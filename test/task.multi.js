/**
 * Sandcrawler Mukti Url Task Tests
 * =================================
 *
 * Basic tests where we want to scrape the content of several urls.
 */
var assert = require('assert'),
    sandcrawler = require('../index.js');

describe('Multi Url Task', function() {

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
    sandcrawler.create({autoClose: false, phantom: {port: 7002}}, function(err, instance) {
      crawler = instance;

      // Debug hook
      crawler.on('phantom:log', function(message) {
        console.log('multi:phantom:log', message);
      });

      crawler.on('phantom:error', function(message) {
        console.log('multi:phantom:error', message);
      });

      done();
    });
  });

  it('should be able to process several urls.', function(done) {

    crawler
      .task([
        'http://localhost:8001/basic.html',
        'http://localhost:8001/basic.html'
      ])
      .inject(function() {
        artoo.scrape('.url-list a', 'href', artoo.done);
      })
      .process(function(err, page) {

        assert.deepEqual(page.data, simpleList);
        assert(page.url === 'http://localhost:8001/basic.html');
      })
      .then(function() {
        done();
      });
  });

  after(function() {
    crawler.spy.kill();
  });
});
