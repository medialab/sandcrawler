/**
 * Sandcrawler Core Tests
 * =======================
 *
 * Tests concerning the main interface of the library.
 */
var assert = require('assert'),
    sandcrawler = require('../../index.js');

describe('When using sandcrawler API', function() {

  // Data
  var simpleList = [
    'http://nicesite.com',
    'http://awesomesite.com',
    'http://prettysite.com',
    'http://unknownsite.com'
  ];

  it('should throw an error when trying to run an invalid scraper.', function() {

    assert.throws(function() {
      sandcrawler.run('tada');
    }, /sandcrawler\.run/);
  });

  it('should be able to run a minimal scraper.', function(done) {

    // Creating the scraper
    var scraper = new sandcrawler.scraper()
      .url('http://localhost:7337/resources/basic.html')
      .script(__dirname + '/../resources/scrapers/basic.js')
      .result(function(err, req, res) {
        assert(false);
        assert.deepEqual(res.data, simpleList);
      });

    // Running the scraper
    sandcrawler.run(scraper, function(err) {
      assert(err === null);
      done();
    });
  });
});
