/**
 * Sandcrawler Phantom Extensions
 * ===============================
 *
 * Slight JavaScript behaviour modifications in order to make the control of
 * the phantom child more convenient.
 */
Object.defineProperty(Error.prototype, 'toJSON', {
  value: function () {
    var alt = {};

    Object.getOwnPropertyNames(this).forEach(function (key) {
      alt[key] = this[key];
    }, this);

    return alt;
  },
  configurable: true
});
