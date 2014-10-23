/**
 * Sandcrawler Core Tests
 * =======================
 *
 * Tests concerning the main interface of the library.
 */
var assert = require('assert'),
    sandcrawler = require('../../index.js');

describe('When using sandcrawler API', function() {

  it('should throw an error when trying to run an invalid scraper.', function() {

    assert.throws(function() {
      sandcrawler.run('tada');
    }, /sandcrawler\.run/);
  });
});
