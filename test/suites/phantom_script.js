/**
 * Sandcrawler Phantom Scripts Tests
 * ==================================
 *
 * Testing the utilities stringifying functions to feed to a Phantom engine.
 */
var assert = require('assert'),
    phscript = require('../../src/phantom_script.js');

describe('Phantom Scripts', function() {
  var r = phscript.regexes;

  it('module\'s regexes should work as expected.', function() {

    // Argument matches
    assert.deepEqual(
      'function($, done) {}'.match(r.argMatch).slice(1),
      ['$', 'done']
    );

    assert.deepEqual(
      'function ($, done) {}'.match(r.argMatch).slice(1),
      ['$', 'done']
    );

    assert.deepEqual(
      'function   ( $ , done ){}'.match(r.argMatch).slice(1),
      ['$', 'done']
    );

    assert.deepEqual(
      'function($, done, otherCrap) {}'.match(r.argMatch).slice(1),
      ['$', 'done']
    );

    // Function replacement
    assert.strictEqual(
      'function($, done) {}'.replace(r.fnReplace, 'hey'),
      'hey {}'
    );

    assert.strictEqual(
      'function ($, done) {}'.replace(r.fnReplace, 'hey'),
      'hey {}'
    );

    assert.strictEqual(
      'function   ( $ , done ){}'.replace(r.fnReplace, 'hey'),
      'hey{}'
    );

    assert.strictEqual(
      'function($, done, otherCrap) {}'.replace(r.fnReplace, 'hey'),
      'hey {}'
    );
  });

  it('should cleanly parse function\'s arguments.', function() {

    assert.deepEqual(
      phscript.argNames('function($, done) {}'),
      ['$', 'done']
    );
  });
});
