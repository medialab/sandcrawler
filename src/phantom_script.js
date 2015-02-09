/**
 * Sandcrawler Phantom Script
 * ===========================
 *
 * JawaScript abstraction useful to wrap pieces of code that will be run on
 * a phantom page context.
 */

// Regexes
var regexes = {
  argMatch: /^function\s*\(\s*([^,\s]+)\s*,\s*([^,)\s]+)/,
  fnReplace: /^function\s*[^(]*\([^)]*\)/
};

// Retrieve the first two arguments of the given stringified function
function argNames(str) {

  // Matching
  var matches = str.match(regexes.argMatch);

  if (!matches)
    throw Error('sandcrawler.phantom_script.arguments: not enough arguments to compile a correct phantom scraper.');

  return [matches[1], matches[2]];
}

// Wrap in context to name several really important variables
function wrap(str, dollarName, doneName) {
  return '(function(' + dollarName + ', ' + doneName + ', undefined){' + str + '})(artoo.$, artoo.done);';
}

// Wrap a JavaScript function into a phantom IIFE
function wrapFunctionString(str, dollarName, doneName) {

  return '(function(){' + wrap('(' + str + ')()', dollarName, doneName) + '})';
}

function fromFunction(fn, check) {
  check = check === false ? false : true;

  if (typeof fn !== 'function')
    throw Error('sandcrawler.phantom_script.fromFunction: given argument is not a function.');

  var str = fn.toString(),
      names = argNames(str);

  // Cleaning up
  str = str.replace(regexes.fnReplace, 'function ()');

  if (check) {
    if (!~str.indexOf(names[1]))
      throw Error('sandcrawler.phantom_script.fromFunction: cannot find any mention of the "' + names[1] + '" callback ' +
                  'into the given function. You are probably never returning control.');
  }

  return wrapFunctionString(str, names[0], names[1]);
}

// Exporting
module.exports = {
  argNames: argNames,
  fromFunction: fromFunction,
  regexes: regexes
};
