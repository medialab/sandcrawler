/**
 * Sandcrawler Static Scrapers Tests
 * ==================================
 *
 * Testing a scrapers using static requests.
 */
var assert = require('assert'),
    sandcrawler = require('../../index.js'),
    samples = require('../samples.js');

describe('When running a static scraper', function() {

  it('should work correctly.', function(done) {

    // Creating the scraper
    var scraper = new sandcrawler.StaticScraper()
      .url('http://localhost:7337/resources/basic.html')
      .parse(function($) {
        return $('.url-list a').scrape('href');
      })
      .result(function(err, req, res) {
        assert(err === null);
        assert.deepEqual(res.data, samples.basic);
      });

    sandcrawler.run(scraper, done);
  });

});
