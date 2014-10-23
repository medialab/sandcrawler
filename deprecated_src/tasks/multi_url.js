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
  this.currentIndex = 0;
  this.urls = urls;
  this.results = [];

  // Listeners
  // TODO: concurrency
  this.on('task:start', function() {
    this.emit('page:scrape', this.urls[0]);
  });

  function handlePage(page) {
    this.currentIndex++;

    if (!(page instanceof Error))
      this.results.push(page.data);
    else
      this.results.push(null);

    if (this.currentIndex < this.urls.length)
      return this.emit('page:scrape', this.urls[this.currentIndex]);
    else
      return this.emit('task:end', this.results);
  }

  this.on('page:process', handlePage.bind(this));
  this.on('page:fail', handlePage.bind(this));
}

util.inherits(MultiUrlTask, Task);

module.exports = MultiUrlTask;
