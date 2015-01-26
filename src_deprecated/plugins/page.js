/**
 * Sandcrawler Page Plugin
 * ========================
 *
 * A plugin listening to messages sent by phantomjs scraped pages.
 */
var phscript = require('../phantom_script.js');

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

          reply(phscript.fromFunction(fn, false));
        };

        var job = self._findJob(body.jobId);
        if (job) self.emit('page:navigation', body.data, job.req, job.res);
      });
    });

    // Unbinding messenger listener on end
    scraper.on('scraper:done', function() {

      for (var k in listeners)
        this.engine.messenger.removeListener('page:' + k, listeners[k]);

      listeners = {};
    });
  };
};
