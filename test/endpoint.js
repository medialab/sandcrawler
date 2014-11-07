/**
 * Sandcrawler Unit Tests Endpoint
 * ================================
 *
 * File requiring tests setup and suites.
 */

var tests = {
  setup: require('./setup.js'),
  core: require('./suites/core.js'),
  simple: require('./suites/simple.js'),
  multiple: require('./suites/multiple.js'),
  complex: require('./suites/complex.js'),
  failures: require('./suites/failures.js'),
  static: require('./suites/static.js')
};
