/**
 * Sandcrawler Helpers
 * ====================
 *
 * A batch of useful helpers.
 */

// Necessary files to inject in the phantom environment to be able to scrape.
var injections = [
  require.resolve('jquery'),
  require.resolve('artoo-js'),
  __dirname + '/../artoo/artoo.method.phantom.js'
];

// Return a artoofied string to send to the bothan spy
function artoofy(fn) {
  if (typeof fn !== 'function')
    throw TypeError('sandcrawler.helpers.artoofy: argument is not a function.');

  return '(function() {artoo.ready(' + fn.toString() + ');})';
}

// Asynchronously lazy load something
function lazyLoad(cond, load, next) {
  if (!cond)
    load(next);
  else
    next();
}

module.exports = {
  artoofy: artoofy,
  injectionFiles: injections,
  lazy: lazyLoad
};
