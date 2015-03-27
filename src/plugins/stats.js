/**
 * Sandcrawler Stats Plugin
 * =========================
 *
 * Simple plugin computing basic statistics about the spider.
 */

function processTime() {
  return parseFloat(process.hrtime()[0] + "." + process.hrtime()[1]);
}

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
      retries: 0,
      discards: 0,

      // Completion
      completion: 0,
      successRate: 0,

      // Time
      startTime: 0,
      totalTime: 0,
      averageTimePerJob: 0,
      getRemainingTimeEstimation: function() {
        return Math.round(
          ((stats.queued + stats.doing) * stats.averageTimePerJob) /
          spider.options.concurrency
        );
      },
      getElapsedTime: function() {
        return processTime() - stats.startTime;
      },

      // Error index
      errorIndex: {}
    };

    spider.stats = stats;

    // Helpers
    function updateCompletion() {
      stats.completion = Math.round((stats.done * 100) / stats.total);
    }

    function updateSuccessRate() {
      stats.successRate = Math.round((stats.successes * 100) / stats.done);
    }

    // Adding listeners
    spider.once('spider:start', function() {
      stats.startTime = processTime();
      stats.queued = spider.initialBuffer.length;
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

      job.time.start = processTime();
    });

    spider.on('job:discard', function(err, job) {
      stats.discards++;
      stats.doing--;
      stats.total--;

      job.time.end = processTime();

      updateCompletion();
    });

    spider.on('job:retry', function(job) {
      stats.retries++;
      stats.queued++;
      stats.doing--;

      updateCompletion();
    });

    spider.on('job:fail', function(err) {
      if (!stats.errorIndex[err.message])
        stats.errorIndex[err.message] = 0;
      stats.errorIndex[err.message]++;
    });

    spider.on('job:end', function(status, job) {
      if (status === 'fail')
        stats.failures++;
      else
        stats.successes++;

      stats.doing--;
      stats.done++;

      updateCompletion();
      updateSuccessRate();

      // Timing
      job.time.end = processTime();

      var jobElapsedTime = job.time.end - job.time.start;
      stats.averageTimePerJob =
        ((stats.done - 1) * stats.averageTimePerJob + jobElapsedTime) /
        stats.done;
    });
  };
};
