/**
 * Sandcrawler Helpers
 * ====================
 *
 * Miscellaneous helper functions.
 */
var _ = require('lodash');

// Is the var a plain object?
function isPlainObject(v) {
  return v instanceof Object &&
         !(v instanceof Array) &&
         !(v instanceof Function);
}

// Recursively extend objects
function extend() {
  var i,
      k,
      res = {},
      l = arguments.length;

  for (i = l - 1; i >= 0; i--)
    for (k in arguments[i])
      if (res[k] && isPlainObject(arguments[i][k]))
        res[k] = extend(arguments[i][k], res[k]);
      else
        res[k] = arguments[i][k];

  return res;
}

// Serialize a JavaScript error
function serializeError(err) {
  var o = {};

  Object.getOwnPropertyNames(err).forEach(function (k) {
    o[k] = err[k];
  });

  return _.omit(o, ['stack', 'type', 'arguments']);
}

// Serialize a tough-cookie Cookie instance
function serializeCookie(cookie) {
  return {
    path: cookie.path,
    name: cookie.key,
    value: cookie.value,
    domain: cookie.domain
  };
}

// Exporting
module.exports = {
  extend: extend,
  serializeCookie: serializeCookie,
  serializeError: serializeError
};
