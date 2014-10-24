/**
 * Sandcrawler Unit Tests Endpoint
 * ================================
 *
 * File requiring tests setup and suites.
 */

var tests = {
  setup: require('./setup.js'),
  core: require('./suites/core.js'),
  minimal: require('./suites/minimal.js'),
  simple: require('./suites/simple.js'),
  multiple: require('./suites/multiple.js')
};
