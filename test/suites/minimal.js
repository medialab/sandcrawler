/**
 * Sandcrawler Simple Scrapers Tests
 * ==================================
 *
 * Testing some simple scrapers use cases.
 */
var assert = require('assert'),
    sandcrawler = require('../../index.js');

// Data
var data = {
  basic: [
    'http://nicesite.com',
    'http://awesomesite.com',
    'http://prettysite.com',
    'http://unknownsite.com'
  ]
}

describe('When running a minimal scraper', function() {

  it('should work correctly.', function(done) {

    // Creating the scraper
    var scraper = new sandcrawler.scraper()
      .url('http://localhost:7337/resources/basic.html')
      .script(__dirname + '/../resources/scrapers/basic.js')
      .result(function(err, req, res) {
        assert.deepEqual(res.data, data.basic);
      });

    // Running the scraper
    sandcrawler.run(scraper, function(err) {
      assert(err === null);
      done();
    });
  });

});
