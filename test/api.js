/**
 * Sandcrawler Unit Tests API
 * ===========================
 *
 * A simple Express server serving files and data needed for the tests
 * to be correctly run.
 */
var express = require('express'),
    app = express();

// Static files
app.use(express.static(__dirname + '/resources'));

// Exporting
module.exports = app;
