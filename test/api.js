/**
 * Sandcrawler Unit Tests API
 * ===========================
 *
 * A simple Express server serving files and data needed for the tests
 * to be correctly run.
 */
var express = require('express'),
    auth = require('basic-auth'),
    app = express();

// Static files
app.use('/resources', express.static(__dirname + '/resources'));

// Helpful routes
var flag = false;
app.get('/retries', function(req, res) {
  if (!flag)
    res.status(404).send('Retry!');
  else
    res.status(200).send('<!DOCTYPE html><html><head><body>Yay!</body></head></html>');

  flag = !flag;
});

app.get('/auth', function(req, res){
  var a = auth(req);

  if (a && a.name === 'admin' && a.pass === 'password')
    return res.status(200).send('<!DOCTYPE html><html><head><body>Yay!</body></head></html>');
  else
    return res.status(403).send('Unauthorized');
});

app.all('/method', function(req, res) {
  if (req.method !== 'POST')
    return res.status(403).send('Unauthorized');
  else
    return res.status(200).send('<!DOCTYPE html><html><head><body>Yay!</body></head></html>');
});

app.get('/useragent', function(req, res) {
  var ua = req.headers['user-agent'];

  if (ua !== 'tada')
    return res.status(403).send('Unauthorized');
  else
    return res.status(200).send('<!DOCTYPE html><html><head><body>Yay!</body></head></html>');
});

app.get('/headers', function(req, res) {
  var h = req.headers['x-tada'];

  if (!h)
    return res.status(403).send('Unauthorized');
  else
    return res.status(200).send('<!DOCTYPE html><html><head><body>Yay!</body></head></html>');
});

if (require.main === module)
  app.listen(7337);

// Exporting
module.exports = app;
