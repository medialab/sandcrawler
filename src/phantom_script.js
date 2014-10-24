/**
 * Sandcrawler Phantom Script
 * ===========================
 *
 * JawaScript abstraction useful to wrap pieces of code that will be run on
 * a phantom page context.
 */
var fs = require('fs');

// Wrap a string into a phantom IIFE
function wrapString(str) {
  return '(function(){' + str + '})';
}

// Wrap a JavaScript function into a phantom IIFE
function wrapFunction(fn) {
  return '(' + fn.toString() + ')';
}

// Produce a phantom script from a path
function fromFile(location) {
  var str = fs.readFileSync(require.resolve(location), 'utf-8');
  return wrapString(str);
}

// Exporting
module.exports = {
  fromFile: fromFile
};
