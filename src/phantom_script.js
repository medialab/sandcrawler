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
  singleArgMatch: /^function\s*\(\s*([^,)\s]+)/,
  fnReplace: /^function\s*[^(]*\([^)]*\)\s*\{([\s\S]*)\}$/
};

// Retrieve the first two arguments of the given stringified function
function argNames(str) {

  // Matching
  var matches = str.match(regexes.argMatch);

  if (!matches)
    throw Error('sandcrawler.phantom_script.arguments: not enough arguments to compile a correct phantom scraper.');

  return [matches[1], matches[2]];
}

// Retrieve the first argument of the given stringified function
function argName(str) {

  // Matching
  var matches = str.match(regexes.singleArgMatch);

  if (!matches)
    throw Error('sandcrawler.phantom_script.arguments: not enough arguments to compile a correct phantom scraper.');

  return [matches[1]];
}

// Wrap in context to name several really important variables
function wrap(str, dollarName, doneName) {
  return doneName ?
    '(function(' + dollarName + ', ' + doneName + ', undefined){' + str + '})(artoo.$, artoo.done);' :
    '(function(' + dollarName + ', undefined){' + str + '})(artoo.$);';
}

// Wrap a JavaScript function into a phantom IIFE
function wrapFunctionString(str, dollarName, doneName) {

  return '(function(){' + wrap(str, dollarName, doneName) + '})';
}

function wrapSynchronousFunctionString(str, dollarName) {
  return '(function(){ return ' + wrap(str, dollarName) + '})';
}

function fromFunction(fn, check, synchronous) {
  check = check === false ? false : true;

  if (typeof fn !== 'function')
    throw Error('sandcrawler.phantom_script.fromFunction: given argument is not a function.');

  var str = fn.toString(),
      names = (synchronous ? argName : argNames)(str);

  // Cleaning up
  str = str.replace(regexes.fnReplace, '$1');

  if (check && !synchronous) {
    if (!~str.indexOf(names[1]))
      throw Error('sandcrawler.phantom_script.fromFunction: cannot find any mention of the "' + names[1] + '" callback ' +
                  'into the given function. You are probably never returning control.');
  }

  return (synchronous ? wrapSynchronousFunctionString : wrapFunctionString)(str, names[0], names[1]);
}

function fromString(str, check, synchronous) {
  check = check === false ? false : true;

  if (typeof str !== 'string')
    throw Error('sandcrawler.phantom_script.fromString: given argument is not a string.');

  if (check && !synchronous) {
    if (!~str.indexOf('done'))
      throw Error('sandcrawler.phantom_script.fromFunction: cannot find any mention of the "done" callback ' +
                  'into the given function. You are probably never returning control.');
  }

  return (synchronous ? wrapSynchronousFunctionString : wrapFunctionString)(str, '$', 'done');
}

// Exporting
module.exports = {
  argName: argName,
  argNames: argNames,
  fromFunction: fromFunction,
  fromString: fromString,
  regexes: regexes
};
