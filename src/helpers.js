/**
 * Sandcrawler Helpers
 * ====================
 *
 * Miscellaneous helper functions.
 */

// Wrap a closure into a phantom-runnable IIFE
function wrapForPhantom(fn) {
  return '(' + fn.toString() + ')';
}

module.exports = {
  wrapForPhantom: wrapForPhantom
};
