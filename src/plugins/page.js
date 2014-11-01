/**
 * Sandcrawler Page Plugin
 * ========================
 *
 * A plugin listening to messages sent by phantomjs scraped pages.
 */
var script = require('../phantom_script.js');

module.exports = function(opts) {

  return function(scraper) {

    var listeners = {};

    // Binding messenger listeners on start
    scraper.on('scraper:start', function() {
      var self = this;

      // Unilateral listeners
      listeners.log = this.engine.messenger.on('page:log', function(msg) {
        var body = msg.body;

        var job = self._findJob(body.jobId);
        if (job) self.emit('page:log', body.data, job.req, job.res);
      });

      listeners.error = this.engine.messenger.on('page:error', function(msg) {
        var body = msg.body;

        var job = self._findJob(body.jobId);
        if (job) self.emit('page:error', body.data, job.req, job.res);
      });

      listeners.alert = this.engine.messenger.on('page:alert', function(msg) {
        var body = msg.body;

        var job = self._findJob(body.jobId);
        if (job) self.emit('page:alert', body.data, job.req, job.res);
      });

      // Bilateral listeners
      listeners.navigation = this.engine.messenger.on('page:navigation', function(msg, reply) {
        var body = msg.body;

        body.data.replyWithJawascript = function(fn) {

          reply(script.fromFunction(fn));
        };

        var job = self._findJob(body.jobId);
        if (job) self.emit('page:navigation', body.data, job.req, job.res);
      });
    });

    // Unbinding messenger listener on end
    scraper.on('scraper:end', function() {
      this.engine.messenger.removeListener('page:log', listeners.log);
      this.engine.messenger.removeListener('page:error', listeners.error);
      this.engine.messenger.removeListener('page:alert', listeners.alert);
      this.engine.messenger.removeListener('page:navigation', listeners.navigation);

      listeners = {};
    });
  };
};
