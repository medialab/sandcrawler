/**
 * Sandcrawler Phantom Scripts Tests
 * ==================================
 *
 * Testing the utilities stringifying functions to feed to a Phantom engine.
 */
var assert = require('assert'),
    phscript = require('../../src/phantom_script.js');

describe('Phantom Scripts', function() {

  it('should cleanly parse function\'s arguments.', function() {

    assert.deepEqual(
      phscript.argNames('function($, done) {}'),
      ['$', 'done']
    );
  });
});
