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

  before(function(done) {
    sandcrawler.create({}, function(err, instance) {
      crawler = instance;

      // Debug hook
      crawler.on('multi:phantom:log', function(message) {
        console.log('multi:phantom:log', message);
      });

      crawler.on('multi:phantom:error', function(message) {
        console.log('multi:phantom:error', message);
      });

      done();
    });
  });

  after(function() {
    crawler.spy.kill();
  });
});
