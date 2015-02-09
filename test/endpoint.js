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

// TODO: browserify builds
// TODO: test scraper method
// TODO: test erroneous cases of function arguments
// TODO: test done calling
// TODO: consolidate phscript regexes
// TODO: sync versions
// TODO: inline versions
// TODO: stop if no scraper defined
// TODO: not possible to pass wrong args to the function
// TODO: self .run including phantom to run with
// TODO: detect when script is probably not returning control
