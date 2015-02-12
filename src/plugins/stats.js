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

      // Counters
      total: 0,
      done: 0,
      doing: 0,
      queued: 0,
      failures: 0,
      successes: 0,

      // Completion
      completion: 0,

      // Time
      startTime: 0,
      totalTime: 0,
      averageTimePerJob: 0,
      getEstimatedTimeToCompletion: function() {
        return (stats.done + stats.doing) * stats.averageTimePerJob;
      },
      getElapsedTime: function() {
        return process.hrtime()[0] - stats.startTime;
      },

      // Error index
      errorIndex: {}
    };

    spider.stats = stats;

    // Helpers
    function updateCompletion() {
      stats.completion = Math.floor((stats.done * 100) / stats.total);
    }

    // Adding listeners
    spider.once('spider:start', function() {
      stats.startTime = process.hrtime()[0];
      stats.queued = spider.queue.length();
      stats.total = stats.queued;
    });

    spider.once('spider:end', function() {
      stats.totalTime = stats.getElapsedTime();
    });

    spider.on('job:add', function() {
      stats.queued++;
      stats.total++;

      updateCompletion();
    });

    spider.on('job:start', function(job) {
      stats.queued--;
      stats.doing++;

      job.time.start = process.hrtime()[0];
    });

    spider.on('job:fail', function(err) {
      if (!stats.errorIndex[err.message])
        stats.errorIndex[err.message] = 0;
      stats.errorIndex[err.message]++;
    });

    spider.on('job:end', function(job) {
      if (job.state.failing)
        stats.failures++;
      else
        stats.successes++;

      stats.doing--;
      stats.done++;

      updateCompletion();

      // Timing
      job.time.end = process.hrtime()[0];

      var jobElapsedTime = job.time.end - job.time.start;
      stats.averageTimePerJob =
        stats.averageTimePerJob + jobElapsedTime / stats.done;
    });
  };
};
