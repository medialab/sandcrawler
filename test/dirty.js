var sandcrawler = require('sandcrawler');

sandcrawler.scrape('https://news.ycombinator.com/', function() {

  artoo.scrape('td.title:has(a):not(:last)', {
    title: {sel: 'a'},
    url: {sel: 'a', attr: 'href'}
  }, artoo.done);

}).then(function(data) {
  // Write data to file or else...
});
