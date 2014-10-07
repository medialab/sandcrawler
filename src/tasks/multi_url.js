/**
 * Sandcrawler Mutli Url Task Class
 * =================================
 *
 * This task is used when one wants to scrape a finite list of urls.
 */

var Task = require('./task.js'),
    util = require('util');

// Main class
function MultiUrlTask(spy, urls) {
  var self = this;

  // Extending task
  Task.call(this, spy);

  // Properties
  this.urls = urls;

  // Listeners
  this.on('task:start', function() {

  });
}

util.inherits(MultiUrlTask, Task);

module.exports = MultiUrlTask;
