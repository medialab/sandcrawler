/**
 * Sandcrawler Core Tests
 * =======================
 *
 * Tests concerning the main interface of the library.
 */
var assert = require('assert'),
    sandcrawler = require('../../index.js');

describe('When using sandcrawler API', function() {

  describe('Core level', function() {
    it('should throw an error when trying to run an invalid scraper.', function() {

      assert.throws(function() {
        sandcrawler.run('tada');
      }, /sandcrawler\.run/);
    });
  });

  describe('Scraper level', function() {
    it('should warn the user when his/her script is probably not returning control.', function() {

      assert.throws(function() {
        var scraper = new sandcrawler.Scraper()
          .jawascript(function() {
            console.log('hello');
          });
      }, /returning control/);
    });

    it('should throw an error when trying to register a script twice.', function() {

      assert.throws(function() {
        var scraper = new sandcrawler.Scraper()
          .script(__dirname + '/../resources/scrapers/basic.js')
          .script(__dirname + '/../resources/scrapers/basic.js');
      }, /script already registered/);
    });

    it('should throw an error when trying to add a feed without an url.', function() {

      assert.throws(function() {
        var scraper = new sandcrawler.Scraper()
          .url({data: 'hello'});
      }, /_wrapJob/);
    });
  });
});
