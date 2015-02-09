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
// require('./suites/failures.js');
require('./suites/static.js');

// TODO: tests function arg names
// TODO: test scraper method
// TODO: user generated error in both static and phantom
// TODO: test erroneous cases of function arguments
// TODO: test done calling
