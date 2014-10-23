/**
 * Sandcrawler Helpers
 * ====================
 *
 * Miscellaneous helper functions.
 */

// Is the var a plain object?
function isPlainObject(v) {
  return v instanceof Object &&
         !(v instanceof Array) &&
         !(v instanceof Function);
}

// Recursively extend objects
function extend() {
  var i,
      k,
      res = {},
      l = arguments.length;

  for (i = l - 1; i >= 0; i--)
    for (k in arguments[i])
      if (res[k] && isPlainObject(arguments[i][k]))
        res[k] = extend(arguments[i][k], res[k]);
      else
        res[k] = arguments[i][k];

  return res;
}

// Wrap a closure into a phantom-runnable IIFE
function wrapForPhantom(scraper) {
  if (typeof scraper === 'function')
    return '(' + scraper.toString() + ')';
  else
    return '(function(){' + scraper + '})';
}

module.exports = {
  extend: extend,
  wrapForPhantom: wrapForPhantom
};
