/**
 * Sandcrawler Taskmaster
 * =======================
 *
 * A phantom task manager able to interact finely with the bothan spy to scrape.
 */

var uuid = require('node-uuid'),
    bothan = require('bothan'),
    helpers = require('./helpers.js'),
    Q = require('q');

// Main Class
function Taskmaster() {
  var self = this;

  // State
  this.spy = null;
  this.runningTasks = {};

  // Utilities
  this.deploy = function() {
    var deferred = Q.defer();

    if (!self.spy) {
      var params = {
        port: 4000,
        debug: true,
        injections: helpers.injectionFiles
      };

      bothan.deploy(params, function(spy) {
        self.spy = spy;
        self.bindEvents();
        deferred.resolve();
      });
    }
    else {
      deferred.resolve();
    }

    return deferred.promise;
  };

  // Methods
  this.runOne = function(url, scraper) {
    return this.deploy().then(function() {
      var taskId = uuid.v4(),
          deferred = Q.defer();

      self.spy.send('task.scrape', {
        url: url,
        scraper: scraper,
        taskId: taskId
      });

      self.runningTasks[taskId] = deferred;
      return deferred.promise;
    });
  };

  // Events
  this.bindEvents = function() {
    self.spy.on('task.results', function(msg) {
      if (!self.runningTasks[msg.taskId])
        return;

      self.runningTasks[msg.taskId].resolve(msg.results);
      delete self.runningTasks[msg.taskId];
    });
  }
}

// Exporting a singleton for the time being
module.exports = new Taskmaster();
