/**
 * Sandcrawler Phantom Script
 * ===========================
 *
 * JawaScript abstraction useful to wrap pieces of code that will be run on
 * a phantom page context.
 */
var fs = require('fs');

var prerequisites = /done\(/g;

function check(str, enabled) {
  if (enabled !== false && !~str.search(prerequisites))
    throw Error('sandcrawler.phantom_script: cannot find any mention of ' +
                '"done" in your script. You are probably never returning ' +
                'control.');
}

// Wrap in context to name several really important variables
function wrap(str) {
  return '(function(done, $, undefined){' + str + '})(artoo.done, artoo.$);';
}

// Wrap a string into a phantom IIFE
function wrapString(str) {
  return '(function(){' + wrap(str) + '})';
}

// Wrap a JavaScript function into a phantom IIFE
function wrapFunction(fn) {
  var str = fn.toString().replace(/function[^(]*\([^)]*\)/, 'function ()');

  return '(function(){' + wrap('(' + str + ')()') + '})';
}

// Produce a phantom script from a path
function fromFile(location, e) {
  var str = wrapString(fs.readFileSync(require.resolve(location), 'utf-8'));
  check(str, e);
  return str;
}

function fromString(s, e) {
  var str = wrapString(s);
  check(str, e);
  return str;
}

function fromFunction(fn, e) {
  var str = wrapFunction(fn);
  check(str, e);
  return str;
}

// Exporting
module.exports = {
  fromFile: fromFile,
  fromFunction: fromFunction,
  fromString: fromString
};
