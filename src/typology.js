/**
 * Sandcrawler Typology
 * =====================
 *
 * Handy data-validation definitions.
 */
var Typology = require('typology');

var t = new Typology();

// Auth
t.add('auth', {
  user: 'string',
  password: '?string'
});

// Configuration
t.add('config', {
  artoo: '?object',
  auth: '?auth',
  autoExit: '?boolean',
  autoRetry: '?boolean|string',
  body: '?string|object',
  bodyType: '?string',
  cheerio: '?object',
  concurrency: '?number',
  cookies: '?array',
  data: '?object',
  encoding: '?string',
  headers: '?object',
  jar: '?boolean|object|string',
  limit: '?number',
  maxRetries: '?number',
  method: '?string',
  phantomPage: '?object',
  proxy: '?string|object',
  timeout: '?number',
  url: '?string|object'
});

// Job feed passed as object
t.add('objectFeed', function(v) {
  return this.check(v, 'object') && (
    this.check(v.url, 'string|object') ||
    !!(v.host || v.hostname)
  );
});

// Feed argument
t.add('feed', function(v) {
  return this.check(v, 'string|objectFeed');
});

module.exports = t;
