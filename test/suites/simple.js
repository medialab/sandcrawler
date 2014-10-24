/**
 * Sandcrawler Simple Scrapers Tests
 * ==================================
 *
 * Testing some simple scrapers use cases.
 */
var assert = require('assert'),
    sandcrawler = require('../../index.js');

// Data
var data = {},
    spawn;

describe('When running fairly simple scrapers', function() {

  before(function(done) {

    // Spawning a custom phantom for the tests
    sandcrawler.spawn({autoClose: false}, function(err, phantom) {
      if (err) throw err;

      spawn = phantom;
    });
  });

  after(function(done) {

    // Now closing the phantom
    spawn.close();
  });
});
