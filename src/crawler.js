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
  var params = helpers.extend(p || {}, {autoClose: true, phantom: {}});

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

    callback(null, new Crawler(spy, params));
  });
}

// Class
function Crawler(spy, params) {

  // Properties
  this.spy = spy;
  this.params = params || {};
  this.runningTasks = [];
  this.closed = false;

  // Bootstrapping spy's event emitter
  this.on = this.spy.on.bind(this.spy);
  this.once = this.spy.once.bind(this.spy);
}

// Prototype
// TODO: iterator task
Crawler.prototype.task = function(feed) {
  var self = this,
      task;

  if (types.get(feed) === 'string')
    task = new tasks.SingleUrl(this.spy, feed);
  else if (types.get(feed) === 'array')
    task = new tasks.MultiUrl(this.spy, feed);

  // Adding the task to running task
  this.runningTasks.push(task.id);

  // Listening the task end
  task.on('task:over', function(success) {
    var idx = self.runningTasks.indexOf(task.id);

    self.runningTasks.splice(idx, 1);

    // If no remaining task, we close the crawler
    if (!self.runningTasks.length && self.params.autoClose === true)
      return self.close();
  });

  return task;
};

Crawler.prototype.close = function() {
  if (this.closed)
    throw Error('sandcrawler.crawler.close: crawler already closed.');

  this.closed = true;

  // TODO: kill socket server only if last one using it
  this.spy.spynet.close();
  this.spy.kill();

  return this;
};

// TODO: middleware system
Crawler.prototype.use = function(middleware) {

};

module.exports = create;
