/**
 * Sandcrawler Basic Tests
 * ========================
 *
 * Basic scraping tests to scaffold the API.
 */
var sandcrawler = require('../index.js');

describe('Basic tests', function() {
  var crawler = null;

  before(function(done) {
    sandcrawler.create({}, function(err, instance) {
      crawler = instance;
      done();
    });
  });

  it('should be possible to scrape from a lone url.', function(done) {
    // crawler
    //   .from('http://localhost:8001/hackernews.html')
    //   .scrape(function() {

    //     // JawaScript
    //     artoo.scrape('td.title:has(a):not(:last)', {
    //       title: {sel: 'a'},
    //       url: {sel: 'a', attr: 'href'}
    //     }, artoo.done);

    //   })
    //   .then(function(data) {
    //     console.log(data);
    //     done();
    //   });
    setTimeout(done, 1000);
  });
});
