/**
 * Sandcrawler Phantom Engine
 * ===========================
 *
 * Using a phantomjs child to scrape the given pages.
 */

/**
 * Main
 */
function PhantomEngine(scraper, phantom) {

  this.type = 'phantom';
  this.phantom = phantom;

  // Fetching method
  this.fetch = function(job, callback) {

    // Figuring timeout
    var timeout = job.req.timeout || scraper.options.timeout;

    // TODO: how to cancel a call --> go bothan
  };


  //   this.on('job:scrape', function(job) {
  //   var timeout = job.req.timeout || this.settings.timeout;

  //   // Sending message to phantom
  //   var call = this.engine.messenger.request(

  //     // We want to scrape
  //     'scrape',

  //     // Sent data
  //     {
  //       id: job.id,
  //       url: job.req.url,
  //       script: this._script,
  //       params: helpers.extend(job.req.params, this.settings.params)
  //     },

  //     // Request parameters
  //     {timeout: timeout},

  //     // Callback
  //     function(err, msg) {
  //       var response = (msg || {}).body || {},
  //           error;

  //       // Resolving call
  //       self._calls.splice(self._calls.indexOf(call), 1);

  //       // Populating response
  //       job.res = response;

  //       if (err)
  //         return self.emit('job:fail', err, job);

  //       // Phantom failure
  //       if (response.fail && response.reason === 'fail') {
  //         error = new Error('phantom-fail');
  //         error.code = response.error.errorCode;
  //         error.reason = response.error.errorString;
  //         return self.emit('job:fail', error, job);
  //       }

  //       // Wrong status code
  //       if (response.fail && response.reason === 'status') {
  //         error = new Error('status-' + (response.status || 'unknown'));
  //         error.status = response.status;
  //         return self.emit('job:fail', error, job);
  //       }

  //       self.emit('job:after', job);
  //     }
  //   );

  //   this._calls.push(call);
  // });
}

/**
 * Exporting
 */
module.exports = PhantomEngine;
