/**
 * Sandcrawler Unit Tests API
 * ===========================
 *
 * A simple Express server serving files and data needed for the tests
 * to be correctly run.
 */
var express = require('express'),
    bodyParser = require('body-parser'),
    cookieParser = require('cookie-parser'),
    auth = require('basic-auth'),
    app = express();

// Helpers
express.response.ko = function() {
  return res.status(403).send('Unauthorized');
};

express.response.ok = function() {
  return this.status(200).send('<!DOCTYPE html><html><head><body>Yay!</body></head></html>');
};

// Middlewares
app.use(cookieParser());
app.use(bodyParser.urlencoded({extended: false}));
app.use(bodyParser.json());

// Static files
app.use('/resources', express.static(__dirname + '/resources'));

// Helpful routes
var flag = false;
app.get('/retries', function(req, res) {
  if (!flag)
    res.status(404).send('Retry!');
  else
    res.ok();

  flag = !flag;
});

app.get('/auth', function(req, res){
  var a = auth(req);

  if (a && a.name === 'admin' && a.pass === 'password')
    return res.ok();
  else
    return res.ko();
});

app.all('/method', function(req, res) {
  if (req.method !== 'POST')
    return res.ko();
  else
    return res.ok();
});

app.get('/useragent', function(req, res) {
  var ua = req.headers['user-agent'];

  if (ua !== 'tada')
    return res.ko();
  else
    return res.ok();
});

app.get('/headers', function(req, res) {
  var h = req.headers['x-tada'];

  if (!h)
    return res.ko();
  else
    return res.ok();
});

app.post('/json', function(req, res) {
  var pass = req.body.pass;

  if (pass !== 'test')
    return res.ko();
  else
    return res.ok();
});

app.post('/urlencoded', function(req, res) {
  var pass = req.body.pass;

  if (pass !== 'test')
    return res.ko();
  else
    return res.ok();
});

app.get('/set-cookie', function(req, res) {
  return res.cookie('hello', 'world').ok();
});

app.get('/check-cookie', function(req, res) {
  var cookie = req.cookies.hello || {};

  if (cookie !== 'world')
    return res.ko();
  else
    return res.ok();
});

if (require.main === module)
  app.listen(7337);

// Exporting
module.exports = app;
