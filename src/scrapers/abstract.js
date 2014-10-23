/**
 * Sandcrawler Abstract Scraper
 * =============================
 *
 * Spine of the sandcrawler's scrapers containing every generic logic working
 * for each of its declinaisons.
 */
var EventEmitter = require('events').EventEmitter,
    util = require('util'),
    uuid = require('uuid'),
    types = require('typology');

/**
 * Main Class
 */
function Scraper() {

  // Extending event emitter
  EventEmitter.call(this);

  // Assigning a unique identifer
  this.id = 'Task[' + uuid.v4() + ']';

  // Hidden properties
  this._stack = [];
  this._middlewares = {
    before: [],
    beforeScraping: [],
    afterScraping: []
  };
}

// Inheriting
util.inherits(Scraper, EventEmitter);

/**
 * Hidden Prototype
 */
Scraper.prototype._wrapFeed = function(mixed) {
  if (types.get(mixed) === 'string')
    return {url: mixed};
  else
    return mixed;
};

Scraper.prototype._start = function(engine) {

};

/**
 * Prototype
 */

// Assigning a single url
Scraper.prototype.url = function(singleUrl) {

  // TODO: type checking
  this._stack.push(this._wrapFeed(singleUrl));
};

// Alias
Scraper.prototype.urls = Scraper.prototype.url;

/**
 * Exporting
 */
module.exports = Scraper;
