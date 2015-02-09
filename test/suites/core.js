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
  });

  describe('Spider level', function() {
    // it('should warn the user when his/her script is probably not returning control.', function() {

    //   assert.throws(function() {
    //     var spider = new sandcrawler.phantomSpider()
    //       .jawascript(function() {
    //         console.log('hello');
    //       });
    //   }, /returning control/);
    // });

    it('should throw an error when trying to add an invalid scraper function.', function() {

    });

    it('shoul throw an error when running a spider without any scraper registerd.', function() {

    });

    it('should throw an error when trying to add a feed without an url.', function() {

      assert.throws(function() {
        var spider = new sandcrawler.phantomSpider()
          .url({data: 'hello'});
      }, /url\(s\)/);
    });
  });
});
