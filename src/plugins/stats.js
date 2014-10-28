/**
 * Sandcrawler Stats Plugin
 * =========================
 *
 * A plugin recording useful stats during a scraper's execution.
 */

module.exports = function(opts) {

  // The function applied by and to the scraper
  return function(scraper) {

    // Adding a property to the scraper
    scraper.stats = {
      startingTime: 0,
      runningTime: 0
    };

    /**
     * Listeners
     */

    // TODO: human readable times for god's sake!

    // Recording starting time
    scraper.on('scraper:start', function() {
      this.stats.startingTime = process.hrtime();
    });

    // Recording running time when scraper stops
    scraper.on('scraper:end', function() {
      this.stats.runningTime = this.stats.startingTime - process.hrtime();
    });
  };
};
