/**
 * Sandcrawler Failure Tests
 * ==========================
 *
 * Testing harsh cases when phantomjs or request crashes and we need to
 * handle the event gracefully.
 */
var assert = require('assert'),
    async = require('async'),
    sandcrawler = require('../../index.js'),
    samples = require('../samples.js');

describe('When dealing with failures', function() {

  describe('Phantomjs crashes', function() {

    it('should be possible to catch phantomjs crashes.', function(done) {

      var scraper = new sandcrawler.scraper()
        .urls([
          'http://localhost:7337/resources/basic.html',
          'http://localhost:7337/resources/basic.html',
          'http://localhost:7337/resources/basic.html'
        ])
        .script(__dirname + '/../resources/scrapers/exit.js', false);

      sandcrawler.spawn(function(err, ghost) {
        ghost.run(scraper, function(err, remains) {
          assert.strictEqual(err.message, 'phantom-crash');
          done();
        });
      });
    });
  });
});
