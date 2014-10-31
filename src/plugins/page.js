/**
 * Sandcrawler Page Plugin
 * ========================
 *
 * A plugin listening to messages sent by phantomjs scraped pages.
 */

module.exports = function(opts) {

  return function(scraper) {

    var listeners = {};

    // Binding messenger listeners on start
    scraper.on('scraper:start', function() {
      var self = this;

      listeners.log = this.engine.spy.messenger.on('page:log', function(msg) {
        var body = msg.body;

        var job = self._findJob(body.jobId);
        if (job) self.emit('page:log', body.data, job.req, job.res);
      });

      listeners.error = this.engine.spy.messenger.on('page:error', function(msg) {
        var body = msg.body;

        var job = self._findJob(body.jobId);
        if (job) self.emit('page:error', body.data, job.req, job.res);
      });
    });

    // Unbinding messenger listener on end
    scraper.on('scraper:end', function() {
      this.engine.spy.messenger.removeListener('page:log', listeners.log);
      this.engine.spy.messenger.removeListener('page:error', listeners.error);

      listeners = {};
    });
  };
};
