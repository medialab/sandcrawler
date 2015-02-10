/**
 * Sandcrawler Unit Tests Endpoint
 * ================================
 *
 * File requiring tests setup and suites.
 */
require('./setup.js');
require('./suites/phantom_script.js');
require('./suites/core.js');
require('./suites/simple.js');
require('./suites/multiple.js');
require('./suites/complex.js');
require('./suites/failures.js');
require('./suites/static.js');

// TODO: browserify builds
// TODO: test scraper method
// TODO: sync versions
// TODO: inline versions
// TODO: self .run including phantom to run with
