/**
 * Sandcrawler Single Url Task Class
 * ==================================
 *
 * This task only targets a single url and is therefore very simple.
 */

var Task = require('./task.js'),
    util = require('util');

// Main class
function SingleUrlTask(spy, url) {
  var self = this;

  // Extending task
  Task.call(this, spy);

  // Properties
  this.url = url;

  // Event listeners
  this.on('task:start', function() {
    this.emit('page:scrape', this.url);
  });

  this.on('page:fail', function(data) {
    this.emit('task:fail', data);
  });

  // TODO: process should include the url as data
  // TODO: process should include a potential error
  this.once('page:process', function(data) {
    this.emit('task:end', data);
  });
}

util.inherits(SingleUrlTask, Task);

module.exports = SingleUrlTask;
