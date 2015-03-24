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
    it('should throw an error when trying to run an invalid spider.', function() {

      assert.throws(function() {
        sandcrawler.run('tada');
      }, /sandcrawler\.run/);
    });

    it('should be possible to change defaults.', function() {
      sandcrawler.config({spawn: {hello: 'world'}});
      assert.strictEqual(require('../../defaults.json').spawn.hello, 'world');
    });
  });

  describe('Spider level', function() {
    it('should work with custom denominators.', function() {
      var spider = sandcrawler.spider(),
          droid = sandcrawler.droid(),
          jawa = sandcrawler.jawa();

      assert.strictEqual(spider.denominator, 'spider');
      assert.strictEqual(droid.denominator, 'droid');
      assert.strictEqual(jawa.denominator, 'jawa');
    });

    it('should warn the user when his/her script is probably not returning control.', function() {

      assert.throws(function() {
        var spider = new sandcrawler.phantomSpider()
          .scraper(function($, done) {
            console.log('hello');
          });
      }, /returning control/);
    });

    it('should throw an error when trying to add an invalid scraper function.', function() {
      assert.throws(function() {
        sandcrawler.phantomSpider()
          .scraper(function($) {});
      }, /arguments/);

      assert.throws(function() {
        sandcrawler.phantomSpider()
          .scraper(function() {});
      }, /arguments/);
    });

    it('should throw an error when trying to add a feed without an url.', function() {

      assert.throws(function() {
        var spider = sandcrawler.spider()
          .url({data: 'hello'});
      }, /url\(s\)/);
    });

    it('should throw an error when trying to set an invalid config.', function() {
      assert.throws(function() {
        var spider = sandcrawler.spider()
          .config({cookies: 'hey'});
      }, /invalid/);
    });
  });
});
