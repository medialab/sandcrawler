/**
 * Sandcrawler Phantom Script
 * ===========================
 *
 * JawaScript abstraction useful to wrap pieces of code that will be run on
 * a phantom page context.
 */
var fs = require('fs');

var prerequisites = /done\(/g;

function check(str) {
  if (!~str.search(prerequisites))
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
function fromFile(location) {
  var str = wrapString(fs.readFileSync(require.resolve(location), 'utf-8'));
  check(str);
  return str;
}

function fromString(s) {
  var str = wrapString(s);
  check(str);
  return str;
}

function fromFunction(fn) {
  var str = wrapFunction(fn);
  check(str);
  return str;
}

// Exporting
module.exports = {
  fromFile: fromFile,
  fromFunction: fromFunction,
  fromString: fromString
};
