/**
 * Sandcrawler Stats Plugin
 * =========================
 *
 * Simple plugin computing basic statistics about the spide.
 */

module.exports = function(opts) {

  return function(spider) {

    // Adding a stat property
    var stats = {
      total: 0,
      done: 0,
      doing: 0,
      queued: 0,
      failures: 0,
      successes: 0,
      completion: 0,
      elapsedTime: 0,
      averageTimePerJob: 0,
      estimatedTimeToCompletion: 0
    };

    spider.stats = stats;

    // Helpers
    function updateCompletion() {
      stats.completion = Math.floor((stats.done * 100) / stats.total);
    }

    // Adding listeners
    spider.once('spider:start', function() {
      stats.queued = spider.queue.length();
      stats.total = stats.queued;
    });

    spider.on('job:add', function() {
      stats.queued++;
      stats.total++;

      updateCompletion();
    });

    spider.on('job:start', function() {
      stats.queued--;
      stats.doing++;
    });

    spider.on('job:end', function(job) {
      if (job.state.failing)
        stats.failures++;
      else
        stats.successes++;

      stats.doing--;
      stats.done++;

      updateCompletion();
    });
  };
};
