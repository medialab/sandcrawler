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
    types = require('typology'),
    artoo = require('artoo-js'),
    tasks = require('./tasks'),
    helpers = require('./helpers.js');

// Constructor
function create(p, callback) {
  if (typeof p === 'function') {
    callback = p;
    p = null;
  }

  // Default parameters
  var params = helpers.extend(p || {});

  // Enforcing basic parameters for the bound spy
  params.phantom.bindings = path.join(__dirname, '..', 'phantom', 'bindings.js');
  params.phantom.data = helpers.extend(
    {
      paths: {
        artoo: artoo.paths.phantom,
        jquery: require.resolve('jquery')
      }
    },
    params.phantom.data
  );

  bothan.deploy(params.phantom, function(err, spy) {
    if (err)
      return callback(err);

    callback(null, new Crawler(spy));
  });
}

// Class
function Crawler(spy) {

  // Properties
  this.spy = spy;

  // Bootstrapping spy's event emitter
  this.on = this.spy.on.bind(this.spy);
  this.once = this.spy.once.bind(this.spy);
}

// Prototype
// TODO: multi and iterator and object list queue
Crawler.prototype.task = function(feed) {
  if (types.get(feed) === 'string')
    return new tasks.SingleUrl(this.spy, feed);
  else (types.get(feed) === 'array')
    return new tasks.MultiUrl(this.spy, feed);
};

// TODO: middleware system
Crawler.prototype.use = function(middleware) {

};

module.exports = create;
