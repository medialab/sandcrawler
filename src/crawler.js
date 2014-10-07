/**
 * Sandcrawler Crawler Class
 * ==========================
 *
 * The crawler class is the main interface to sandcrawler's utilities. It
 * enables the user to navigate through a series of webpage to retrieve
 * the needed data.
 */
var bothan = require('bothan'),
    path = require('path'),
    artoo = require('artoo-js'),
    Scraper = require('./scraper.js');

// Constructor
function create(params, callback) {
  var spyParams = {
    bindings: path.join(__dirname, '..', 'phantom', 'bindings.js'),
    data: {
      paths: {
        artoo: artoo.paths.phantom,
        jquery: require.resolve('jquery')
      }
    }
  };

  bothan.deploy(spyParams, function(err, spy) {
    if (err)
      return callback(err);

    callback(null, new Crawler(spy));
  });
}

// Class
function Crawler(spy) {

  // Properties
  this.spy = spy;
  this.spy.on('phantom:log', function(data) {
    console.log('log:', data);
  });

  // TODO: possibility to retrieve stack
  this.spy.on('phantom:error', function(data) {
    console.log('error:', data);
  });
  // TODO: bind on of spy on the crawler itself
}

// Prototype
// TODO: multi and iterator and object list queue
Crawler.prototype.task = function(feed) {
  return new Scraper(this.spy, feed);
};

// TODO: middleware system
Crawler.prototype.use = function(middleware) {

};

module.exports = create;
