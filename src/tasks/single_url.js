/**
 * Sandcrawler Task Class
 * =======================
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

  // Methods
  this.start = function() {

    // Notifying the phantom child
    // TODO: abstract to __scrape
    this.spy.messenger
      .request(
        'scrape',
        {
          id: this.id,
          url: this.url,
          scraper: this.scraper,
          timeout: 2000
        },
        {timeout: 2000}
      )
      .then(function(response) {
        self.emit('task:process', response.data);
        self.emit('task:end', response.data);
      })
      .fail(function(err) {
        self.emit('task:fail', {err: err});
      });
  };
}

util.inherits(SingleUrlTask, Task);

module.exports = SingleUrlTask;
