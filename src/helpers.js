/**
 * Sandcrawler Helpers
 * ====================
 *
 * Miscellaneous helper functions.
 */

// Wrap a closure into a phantom-runnable IIFE
function wrapForPhantom(scraper) {
  if (typeof scraper === 'function')
    return '(' + scraper.toString() + ')';
  else
    return '(function(){' + scraper + '})';
}

module.exports = {
  wrapForPhantom: wrapForPhantom
};
