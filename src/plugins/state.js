/**
 * Sandcrawler State Plugin
 * =========================
 *
 * Compilation of events registered at instantiation and dealing mostly with
 * scraper and job states.
 */

module.exports = function() {

  // Plugin itself
  return function(scraper) {

    // Locking events
    scraper.on('scraper:lock', function() {
      if (this.state.locked)
        return;

      this.state.paused = true;
      this.state.locked = true;
    });

    scraper.on('scraper:unlock', function() {
      if (!this.state.locked)
        return;

      this.state.locked = false;
      this.emit('scraper:resume');
    });

    // Pausing events
    scraper.on('scraper:pause', function() {
      if (this.state.paused)
        return;

      this.state.paused = true;
    });

    scraper.on('scraper:resume', function() {
      if (!this.state.paused || this.state.locked)
        return;

      this.state.paused = false;
    });

    // Emitting the scraper:end event
    scraper.once('scraper:success', function() {
      if (this.settings.autoExit !== false)
        this.emit('scraper:end', 'success', this._remains);
    });

    scraper.once('scraper:fail', function() {
      if (this.settings.autoExit !== false)
        this.emit('scraper:end', 'fail', this._remains);
    });

    // When the scraper is over, we update its state
    scraper.once('scraper:end', function() {
      this.state.done = true;
      this.state.running = false;
    });

    // When a job fail, we update its state
    scraper.on('job:fail', function(err, job) {
      job.state.failing = true;

      // If autoRetry is on, we retry
      if (this.settings.autoRetry)
        if (this.settings.autoRetry === 'now')
          job.req.retryNow();
        else
          job.req.retryLater();
    });
  };
};
