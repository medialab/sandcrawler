;(function(undefined) {
  'use strict';

  /**
   * artoo core
   * ===========
   *
   * The main artoo namespace and its vital properties.
   */

  // Checking whether a body exists
  var body;
  if ('document' in this) {
    body = document.getElementsByTagName('body')[0];
    if (!body) {
      body = document.createElement('body');
      document.documentElement.appendChild(body);
    }
  }

  // Main object
  var artoo = {

    // Standard properties
    $: {},
    jquery: {
      applyPlugins: function() {
        artoo.jquery.plugins.map(function(p) {
          p(artoo.$);
        });
      },
      plugins: []
    },
    mountNode: body,
    stylesheets: {},
    templates: {},

    // Emitter shim properties
    _enabled: true,
    _children: [],
    _handlers: {},
    _handlersAll: []
  };

  // Non-writable version
  Object.defineProperty(artoo, 'version', {
    value: '0.3.1'
  });

  // Exporting to global scope
  this.artoo = artoo;
}).call(this);

(function() {
  'use strict';

  /**
   * Here is the list of every allowed parameter when using Emitter#on:
   * @type {Object}
   */
  var __allowedOptions = {
    once: 'boolean',
    scope: 'object'
  };


  /**
   * The emitter's constructor. It initializes the handlers-per-events store and
   * the global handlers store.
   *
   * Emitters are useful for non-DOM events communication. Read its methods
   * documentation for more information about how it works.
   *
   * @return {Emitter}         The fresh new instance.
   */
  var Emitter = function() {
    this._enabled = true;
    this._children = [];
    this._handlers = {};
    this._handlersAll = [];
  };


  /**
   * This method binds one or more functions to the emitter, handled to one or a
   * suite of events. So, these functions will be executed anytime one related
   * event is emitted.
   *
   * It is also possible to bind a function to any emitted event by not
   * specifying any event to bind the function to.
   *
   * Recognized options:
   * *******************
   *  - {?boolean} once   If true, the handlers will be unbound after the first
   *                      execution. Default value: false.
   *  - {?object}  scope  If a scope is given, then the listeners will be called
   *                      with this scope as "this".
   *
   * Variant 1:
   * **********
   * > myEmitter.on('myEvent', function(e) { console.log(e); });
   * > // Or:
   * > myEmitter.on('myEvent', function(e) { console.log(e); }, { once: true });
   *
   * @param  {string}   event   The event to listen to.
   * @param  {function} handler The function to bind.
   * @param  {?object}  options Eventually some options.
   * @return {Emitter}          Returns this.
   *
   * Variant 2:
   * **********
   * > myEmitter.on(
   * >   ['myEvent1', 'myEvent2'],
   * >   function(e) { console.log(e); }
   * >);
   * > // Or:
   * > myEmitter.on(
   * >   ['myEvent1', 'myEvent2'],
   * >   function(e) { console.log(e); }
   * >   { once: true }}
   * >);
   *
   * @param  {array}    events  The events to listen to.
   * @param  {function} handler The function to bind.
   * @param  {?object}  options Eventually some options.
   * @return {Emitter}          Returns this.
   *
   * Variant 3:
   * **********
   * > myEmitter.on({
   * >   myEvent1: function(e) { console.log(e); },
   * >   myEvent2: function(e) { console.log(e); }
   * > });
   * > // Or:
   * > myEmitter.on({
   * >   myEvent1: function(e) { console.log(e); },
   * >   myEvent2: function(e) { console.log(e); }
   * > }, { once: true });
   *
   * @param  {object}  bindings An object containing pairs event / function.
   * @param  {?object}  options Eventually some options.
   * @return {Emitter}          Returns this.
   *
   * Variant 4:
   * **********
   * > myEmitter.on(function(e) { console.log(e); });
   * > // Or:
   * > myEmitter.on(function(e) { console.log(e); }, { once: true});
   *
   * @param  {function} handler The function to bind to every events.
   * @param  {?object}  options Eventually some options.
   * @return {Emitter}          Returns this.
   */
  Emitter.prototype.on = function(a, b, c) {
    var i,
        l,
        k,
        event,
        eArray,
        bindingObject;

    // Variant 1 and 2:
    if (typeof b === 'function') {
      eArray = typeof a === 'string' ?
        [a] :
        a;

      for (i = 0, l = eArray.length; i !== l; i += 1) {
        event = eArray[i];

        // Check that event is not '':
        if (!event)
          continue;

        if (!this._handlers[event])
          this._handlers[event] = [];

        bindingObject = {
          handler: b
        };

        for (k in c || {})
          if (__allowedOptions[k])
            bindingObject[k] = c[k];
          else
            throw new Error(
              'The option "' + k + '" is not recognized by Emmett.'
            );

        this._handlers[event].push(bindingObject);
      }

    // Variant 3:
    } else if (a && typeof a === 'object' && !Array.isArray(a))
      for (event in a)
        Emitter.prototype.on.call(this, event, a[event], b);

    // Variant 4:
    else if (typeof a === 'function') {
      bindingObject = {
        handler: a
      };

      for (k in c || {})
        if (__allowedOptions[k])
          bindingObject[k] = c[k];
        else
          throw new Error(
            'The option "' + k + '" is not recognized by Emmett.'
          );

      this._handlersAll.push(bindingObject);
    }

    // No matching variant:
    else
      throw new Error('Wrong arguments.');

    return this;
  };


  /**
   * This method works exactly as the previous #on, but will add an options
   * object if none is given, and set the option "once" to true.
   *
   * The polymorphism works exactly as with the #on method.
   */
  Emitter.prototype.once = function(a, b, c) {
    // Variant 1 and 2:
    if (typeof b === 'function') {
      c = c || {};
      c.once = true;
      this.on(a, b, c);

    // Variants 3 and 4:
    } else if (
      // Variant 3:
      (a && typeof a === 'object' && !Array.isArray(a)) ||
      // Variant 4:
      (typeof a === 'function')
    ) {
      b = b || {};
      b.once = true;
      this.on(a, b);

    // No matching variant:
    } else
      throw new Error('Wrong arguments.');

    return this;
  };


  /**
   * This method unbinds one or more functions from events of the emitter. So,
   * these functions will no more be executed when the related events are
   * emitted. If the functions were not bound to the events, nothing will
   * happen, and no error will be thrown.
   *
   * Variant 1:
   * **********
   * > myEmitter.off('myEvent', myHandler);
   *
   * @param  {string}   event   The event to unbind the handler from.
   * @param  {function} handler The function to unbind.
   * @return {Emitter}          Returns this.
   *
   * Variant 2:
   * **********
   * > myEmitter.off(['myEvent1', 'myEvent2'], myHandler);
   *
   * @param  {array}    events  The events to unbind the handler from.
   * @param  {function} handler The function to unbind.
   * @return {Emitter}          Returns this.
   *
   * Variant 3:
   * **********
   * > myEmitter.off({
   * >   myEvent1: myHandler1,
   * >   myEvent2: myHandler2
   * > });
   *
   * @param  {object} bindings An object containing pairs event / function.
   * @return {Emitter}         Returns this.
   *
   * Variant 4:
   * **********
   * > myEmitter.off(myHandler);
   *
   * @param  {function} handler The function to unbind from every events.
   * @return {Emitter}          Returns this.
   */
  Emitter.prototype.off = function(events, handler) {
    var i,
        n,
        j,
        m,
        k,
        a,
        event,
        eArray = typeof events === 'string' ?
          [events] :
          events;

    if (arguments.length === 1 && typeof eArray === 'function') {
      handler = arguments[0];

      // Handlers bound to events:
      for (k in this._handlers) {
        a = [];
        for (i = 0, n = this._handlers[k].length; i !== n; i += 1)
          if (this._handlers[k][i].handler !== handler)
            a.push(this._handlers[k][i]);
        this._handlers[k] = a;
      }

      a = [];
      for (i = 0, n = this._handlersAll.length; i !== n; i += 1)
        if (this._handlersAll[i].handler !== handler)
          a.push(this._handlersAll[i]);
      this._handlersAll = a;
    }

    else if (arguments.length === 2) {
      for (i = 0, n = eArray.length; i !== n; i += 1) {
        event = eArray[i];
        if (this._handlers[event]) {
          a = [];
          for (j = 0, m = this._handlers[event].length; j !== m; j += 1)
            if (this._handlers[event][j].handler !== handler)
              a.push(this._handlers[event][j]);

          this._handlers[event] = a;
        }

        if (this._handlers[event] && this._handlers[event].length === 0)
          delete this._handlers[event];
      }
    }

    return this;
  };


  /**
   * This method unbinds every handlers attached to every or any events. So,
   * these functions will no more be executed when the related events are
   * emitted. If the functions were not bound to the events, nothing will
   * happen, and no error will be thrown.
   *
   * Usage:
   * ******
   * > myEmitter.unbindAll();
   *
   * @return {Emitter}      Returns this.
   */
  Emitter.prototype.unbindAll = function() {
    var k;

    this._handlersAll = [];
    for (k in this._handlers)
      delete this._handlers[k];

    return this;
  };


  /**
   * This method emits the specified event(s), and executes every handlers bound
   * to the event(s).
   *
   * Use cases:
   * **********
   * > myEmitter.emit('myEvent');
   * > myEmitter.emit('myEvent', myData);
   * > myEmitter.emit(['myEvent1', 'myEvent2']);
   * > myEmitter.emit(['myEvent1', 'myEvent2'], myData);
   *
   * @param  {string|array} events The event(s) to emit.
   * @param  {object?}      data   The data.
   * @return {Emitter}             Returns this.
   */
  Emitter.prototype.emit = function(events, data) {
    var i,
        n,
        j,
        m,
        a,
        event,
        child,
        handlers,
        eventName,
        self = this,
        eArray = typeof events === 'string' ?
          [events] :
          events;

    // Check that the emitter is enabled:
    if (!this._enabled)
      return this;

    data = data === undefined ? {} : data;

    for (i = 0, n = eArray.length; i !== n; i += 1) {
      eventName = eArray[i];
      handlers = (this._handlers[eventName] || []).concat(this._handlersAll);

      if (handlers.length) {
        event = {
          type: eventName,
          data: data || {},
          target: this
        };
        a = [];

        for (j = 0, m = handlers.length; j !== m; j += 1) {
          handlers[j].handler.call(
            'scope' in handlers[j] ? handlers[j].scope : this,
            event
          );
          if (!handlers[j].once)
            a.push(handlers[j]);
        }

        this._handlers[eventName] = a;
      }
    }

    // Events propagation:
    for (i = 0, n = this._children.length; i !== n; i += 1) {
      child = this._children[i];
      child.emit.apply(child, arguments);
    }

    return this;
  };


  /**
   * This method creates a new instance of Emitter and binds it as a child. Here
   * is what children do:
   *  - When the parent emits an event, the children will emit the same later
   *  - When a child is killed, it is automatically unreferenced from the parent
   *  - When the parent is killed, all children will be killed as well
   *
   * @return {Emitter} Returns the fresh new child.
   */
  Emitter.prototype.child = function() {
    var self = this,
        child = new Emitter();

    child.on('emmett:kill', function() {
      if (self._children)
        for (var i = 0, l = self._children.length; i < l; i++)
          if (self._children[i] === child) {
            self._children.splice(i, 1);
            break;
          }
    });
    this._children.push(child);

    return child;
  };

  /**
   * This returns an array of handler functions corresponding to the given
   * event or every handler functions if an event were not to be given.
   *
   * @param  {?string} event Name of the event.
   * @return {Emitter} Returns this.
   */
  function mapHandlers(a) {
    var i, l, h = [];

    for (i = 0, l = a.length; i < l; i++)
      h.push(a[i].handler);

    return h;
  }

  Emitter.prototype.listeners = function(event) {
    var handlers = [],
        k,
        i,
        l;

    // If no event is passed, we return every handlers
    if (!event) {
      handlers = mapHandlers(this._handlersAll);

      for (k in this._handlers)
        handlers = handlers.concat(mapHandlers(this._handlers[k]));

      // Retrieving handlers per children
      for (i = 0, l = this._children.length; i < l; i++)
        handlers = handlers.concat(this._children[i].listeners());
    }

    // Else we only retrieve the needed handlers
    else {
      handlers = mapHandlers(this._handlers[event]);

      // Retrieving handlers per children
      for (i = 0, l = this._children.length; i < l; i++)
        handlers = handlers.concat(this._children[i].listeners(event));
    }

    return handlers;
  };


  /**
   * This method will first dispatch a "emmett:kill" event, and then unbinds all
   * listeners and make it impossible to ever rebind any listener to any event.
   */
  Emitter.prototype.kill = function() {
    this.emit('emmett:kill');

    this.unbindAll();
    this._handlers = null;
    this._handlersAll = null;
    this._enabled = false;

    if (this._children)
      for (var i = 0, l = this._children.length; i < l; i++)
        this._children[i].kill();

    this._children = null;
  };


  /**
   * This method disabled the emitter, which means its emit method will do
   * nothing.
   *
   * @return {Emitter} Returns this.
   */
  Emitter.prototype.disable = function() {
    this._enabled = false;

    return this;
  };


  /**
   * This method enables the emitter.
   *
   * @return {Emitter} Returns this.
   */
  Emitter.prototype.enable = function() {
    this._enabled = true;

    return this;
  };


  /**
   * Version:
   */
  Emitter.version = '2.1.1';


  // Export:
  artoo.emitter = Emitter;
}).call(this);

/*!
 * jQuery Simulate v1.0.1 - simulate browser mouse and keyboard events
 * https://github.com/jquery/jquery-simulate
 *
 * Copyright jQuery Foundation and other contributors
 * Released under the MIT license.
 * http://jquery.org/license
 */

;(function(undefined) {

  function _simulate($) {
    var rkeyEvent = /^key/,
      rmouseEvent = /^(?:mouse|contextmenu)|click/;

    $.fn.simulate = function( type, options ) {
      return this.each(function() {
        new $.simulate( this, type, options );
      });
    };

    $.simulate = function( elem, type, options ) {
      var method = $.camelCase( "simulate-" + type );

      this.target = elem;
      this.options = options;

      if ( this[ method ] ) {
        this[ method ]();
      } else {
        this.simulateEvent( elem, type, options );
      }
    };

    $.extend( $.simulate, {

      keyCode: {
        BACKSPACE: 8,
        COMMA: 188,
        DELETE: 46,
        DOWN: 40,
        END: 35,
        ENTER: 13,
        ESCAPE: 27,
        HOME: 36,
        LEFT: 37,
        NUMPAD_ADD: 107,
        NUMPAD_DECIMAL: 110,
        NUMPAD_DIVIDE: 111,
        NUMPAD_ENTER: 108,
        NUMPAD_MULTIPLY: 106,
        NUMPAD_SUBTRACT: 109,
        PAGE_DOWN: 34,
        PAGE_UP: 33,
        PERIOD: 190,
        RIGHT: 39,
        SPACE: 32,
        TAB: 9,
        UP: 38
      },

      buttonCode: {
        LEFT: 0,
        MIDDLE: 1,
        RIGHT: 2
      }
    });

    $.extend( $.simulate.prototype, {

      simulateEvent: function( elem, type, options ) {
        var event = this.createEvent( type, options );
        this.dispatchEvent( elem, type, event, options );
      },

      createEvent: function( type, options ) {
        if ( rkeyEvent.test( type ) ) {
          return this.keyEvent( type, options );
        }

        if ( rmouseEvent.test( type ) ) {
          return this.mouseEvent( type, options );
        }
      },

      mouseEvent: function( type, options ) {
        var event, eventDoc, doc, body;
        options = $.extend({
          bubbles: true,
          cancelable: (type !== "mousemove"),
          view: window,
          detail: 0,
          screenX: 0,
          screenY: 0,
          clientX: 1,
          clientY: 1,
          ctrlKey: false,
          altKey: false,
          shiftKey: false,
          metaKey: false,
          button: 0,
          relatedTarget: undefined
        }, options );

        if ( document.createEvent ) {
          event = document.createEvent( "MouseEvents" );
          event.initMouseEvent( type, options.bubbles, options.cancelable,
            options.view, options.detail,
            options.screenX, options.screenY, options.clientX, options.clientY,
            options.ctrlKey, options.altKey, options.shiftKey, options.metaKey,
            options.button, options.relatedTarget || document.body.parentNode );

          // IE 9+ creates events with pageX and pageY set to 0.
          // Trying to modify the properties throws an error,
          // so we define getters to return the correct values.
          if ( event.pageX === 0 && event.pageY === 0 && Object.defineProperty ) {
            eventDoc = event.relatedTarget.ownerDocument || document;
            doc = eventDoc.documentElement;
            body = eventDoc.body;

            Object.defineProperty( event, "pageX", {
              get: function() {
                return options.clientX +
                  ( doc && doc.scrollLeft || body && body.scrollLeft || 0 ) -
                  ( doc && doc.clientLeft || body && body.clientLeft || 0 );
              }
            });
            Object.defineProperty( event, "pageY", {
              get: function() {
                return options.clientY +
                  ( doc && doc.scrollTop || body && body.scrollTop || 0 ) -
                  ( doc && doc.clientTop || body && body.clientTop || 0 );
              }
            });
          }
        } else if ( document.createEventObject ) {
          event = document.createEventObject();
          $.extend( event, options );
          // standards event.button uses constants defined here: http://msdn.microsoft.com/en-us/library/ie/ff974877(v=vs.85).aspx
          // old IE event.button uses constants defined here: http://msdn.microsoft.com/en-us/library/ie/ms533544(v=vs.85).aspx
          // so we actually need to map the standard back to oldIE
          event.button = {
            0: 1,
            1: 4,
            2: 2
          }[ event.button ] || ( event.button === -1 ? 0 : event.button );
        }

        return event;
      },

      keyEvent: function( type, options ) {
        var event;
        options = $.extend({
          bubbles: true,
          cancelable: true,
          view: window,
          ctrlKey: false,
          altKey: false,
          shiftKey: false,
          metaKey: false,
          keyCode: 0,
          charCode: undefined
        }, options );

        if ( document.createEvent ) {
          try {
            event = document.createEvent( "KeyEvents" );
            event.initKeyEvent( type, options.bubbles, options.cancelable, options.view,
              options.ctrlKey, options.altKey, options.shiftKey, options.metaKey,
              options.keyCode, options.charCode );
          // initKeyEvent throws an exception in WebKit
          // see: http://stackoverflow.com/questions/6406784/initkeyevent-keypress-only-works-in-firefox-need-a-cross-browser-solution
          // and also https://bugs.webkit.org/show_bug.cgi?id=13368
          // fall back to a generic event until we decide to implement initKeyboardEvent
          } catch( err ) {
            event = document.createEvent( "Events" );
            event.initEvent( type, options.bubbles, options.cancelable );
            $.extend( event, {
              view: options.view,
              ctrlKey: options.ctrlKey,
              altKey: options.altKey,
              shiftKey: options.shiftKey,
              metaKey: options.metaKey,
              keyCode: options.keyCode,
              charCode: options.charCode
            });
          }
        } else if ( document.createEventObject ) {
          event = document.createEventObject();
          $.extend( event, options );
        }

        if ( !!/msie [\w.]+/.exec( navigator.userAgent.toLowerCase() ) || (({}).toString.call( window.opera ) === "[object Opera]") ) {
          event.keyCode = (options.charCode > 0) ? options.charCode : options.keyCode;
          event.charCode = undefined;
        }

        return event;
      },

      dispatchEvent: function( elem, type, event ) {
        if ( elem[ type ] ) {
          elem[ type ]();
        } else if ( elem.dispatchEvent ) {
          elem.dispatchEvent( event );
        } else if ( elem.fireEvent ) {
          elem.fireEvent( "on" + type, event );
        }
      },

      simulateFocus: function() {
        var focusinEvent,
          triggered = false,
          element = $( this.target );

        function trigger() {
          triggered = true;
        }

        element.bind( "focus", trigger );
        element[ 0 ].focus();

        if ( !triggered ) {
          focusinEvent = $.Event( "focusin" );
          focusinEvent.preventDefault();
          element.trigger( focusinEvent );
          element.triggerHandler( "focus" );
        }
        element.unbind( "focus", trigger );
      },

      simulateBlur: function() {
        var focusoutEvent,
          triggered = false,
          element = $( this.target );

        function trigger() {
          triggered = true;
        }

        element.bind( "blur", trigger );
        element[ 0 ].blur();

        // blur events are async in IE
        setTimeout(function() {
          // IE won't let the blur occur if the window is inactive
          if ( element[ 0 ].ownerDocument.activeElement === element[ 0 ] ) {
            element[ 0 ].ownerDocument.body.focus();
          }

          // Firefox won't trigger events if the window is inactive
          // IE doesn't trigger events if we had to manually focus the body
          if ( !triggered ) {
            focusoutEvent = $.Event( "focusout" );
            focusoutEvent.preventDefault();
            element.trigger( focusoutEvent );
            element.triggerHandler( "blur" );
          }
          element.unbind( "blur", trigger );
        }, 1 );
      }
    });



    /** complex events **/

    function findCenter( elem ) {
      var offset,
        document = $( elem.ownerDocument );
      elem = $( elem );
      offset = elem.offset();

      return {
        x: offset.left + elem.outerWidth() / 2 - document.scrollLeft(),
        y: offset.top + elem.outerHeight() / 2 - document.scrollTop()
      };
    }

    function findCorner( elem ) {
      var offset,
        document = $( elem.ownerDocument );
      elem = $( elem );
      offset = elem.offset();

      return {
        x: offset.left - document.scrollLeft(),
        y: offset.top - document.scrollTop()
      };
    }

    $.extend( $.simulate.prototype, {
      simulateDrag: function() {
        var i = 0,
          target = this.target,
          eventDoc = target.ownerDocument,
          options = this.options,
          center = options.handle === "corner" ? findCorner( target ) : findCenter( target ),
          x = Math.floor( center.x ),
          y = Math.floor( center.y ),
          coord = { clientX: x, clientY: y },
          dx = options.dx || ( options.x !== undefined ? options.x - x : 0 ),
          dy = options.dy || ( options.y !== undefined ? options.y - y : 0 ),
          moves = options.moves || 3;

        this.simulateEvent( target, "mousedown", coord );

        for ( ; i < moves ; i++ ) {
          x += dx / moves;
          y += dy / moves;

          coord = {
            clientX: Math.round( x ),
            clientY: Math.round( y )
          };

          this.simulateEvent( eventDoc, "mousemove", coord );
        }

        if ( $.contains( eventDoc, target ) ) {
          this.simulateEvent( target, "mouseup", coord );
          this.simulateEvent( target, "click", coord );
        } else {
          this.simulateEvent( eventDoc, "mouseup", coord );
        }
      }
    });
  }

  // Exporting
  artoo.jquery.plugins.push(_simulate);
}).call(this);

;(function(undefined) {
  'use strict';

  /**
   * artoo beep
   * ===========
   *
   * Experimental feature designed to make artoo beep.
   */

  var collections = {
    greet: ['announce', 'excited', 'hello', 'music', 'original', 'welcome'],
    info: ['determined', 'flourish', 'playful', 'sassy', 'talk', 'whistling'],
    warn: ['assert', 'laugh', 'question', 'quick', 'strange', 'threat'],
    error: ['sad', 'scream', 'shocked', 'weep']
  };

  var sounds = collections.greet
    .concat(collections.info)
    .concat(collections.warn)
    .concat(collections.error);

  // Helpers
  function randomInArray(a) {
    return a[Math.floor(Math.random() * a.length)];
  }

  // Playing the base64 sound
  artoo.beep = function(a1, a2) {
    var sound,
        callback,
        chosenSound;

    if (typeof a1 === 'function') {
      callback = a1;
    }
    else {
      sound = a1;
      if (typeof a2 === 'function')
        callback = a2;
      else if (typeof a2 !== 'undefined')
        throw Error('artoo.beep: second argument have to be a function.');
    }

    if (artoo.helpers.isArray(sound))
      chosenSound = randomInArray(sound);
    else
      chosenSound = sound || randomInArray(sounds);

    if (chosenSound in collections)
      chosenSound = randomInArray(collections[chosenSound]);

    if (!~sounds.indexOf(chosenSound))
      throw Error('artoo.beep: wrong sound specified.');

    var player = new Audio(artoo.settings.beep.endpoint + chosenSound + '.ogg');
    if(callback)
      player.addEventListener('ended', function() {
        callback();
      });
    player.play();
  };

  // Exposing available beeps
  Object.defineProperty(artoo.beep, 'available', {
    value: sounds
  });

  // Exposing collections
  Object.defineProperty(artoo.beep, 'collections', {
    value: collections
  });

  // Creating shortcuts
  // NOTE: not using bind here to avoid messing with phantomjs
  sounds.concat(Object.keys(collections)).forEach(function(s) {
    artoo.beep[s] = function() {
      artoo.beep(s);
    };
  });
}).call(this);

;(function(undefined) {
  'use strict';

  /**
   * artoo settings
   * ===============
   *
   * artoo default settings that user may override.
   */

  // Defaults
  artoo.settings = {

    // Root settings
    autoInit: true,
    autoExec: true,
    chromeExtension: false,
    env: 'dev',
    eval: null,
    reExec: true,
    reload: false,
    scriptUrl: null,

    // Methods settings
    beep: {
      endpoint: '//medialab.github.io/artoo/sounds/'
    },
    cache: {
      delimiter: '%'
    },
    dependencies: [],
    jquery: {
      version: '2.1.3',
      force: false
    },
    log: {
      beeping: false,
      enabled: true,
      level: 'verbose',
      welcome: true
    },
    store: {
      engine: 'local'
    }
  };

  // Setting utility
  artoo.loadSettings = function(ns) {
    artoo.settings = artoo.helpers.extend(ns, artoo.settings);
  };
}).call(this);

;(function(undefined) {
  'use strict';

  /**
   * artoo helpers
   * ==============
   *
   * Some useful helpers.
   */
  var _root = this;

  // Extending Emmett
  Object.setPrototypeOf = Object.setPrototypeOf || function (obj, proto) {
    obj.__proto__ = proto;
    return obj;
  };
  var ee = new artoo.emitter();
  Object.setPrototypeOf(artoo, Object.getPrototypeOf(ee));


  // Legacy support
  // TODO: drop this asap
  artoo.hooks = {
    trigger: function(name) {
      artoo.emit(name);
    }
  };


  /**
   * Generic Helpers
   * ----------------
   *
   * Some basic helpers from collection handling to type checking.
   */

  // Useless function
  function noop() {}

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

  // Is the var an array?
  function isArray(v) {
    return v instanceof Array;
  }

  // Is the var an object?
  function isObject(v) {
    return v instanceof Object;
  }

  // Is the var a real NaN
  function isRealNaN(v) {
    return isNaN(v) && (typeof v === 'number');
  }

  // Is the var a plain object?
  function isPlainObject(v) {
    return v instanceof Object &&
           !(v instanceof Array) &&
           !(v instanceof Function);
  }

  // Is a var non primitive?
  function isNonPrimitive(v) {
    return isPlainObject(v) || isArray(v);
  }

  // Is a var primitive?
  function isPrimitive(v) {
    return !isNonScalar(v);
  }

  // Get first item of array returning true to given function
  function first(a, fn, scope) {
    for (var i = 0, l = a.length; i < l; i++) {
      if (fn.call(scope || null, a[i]))
        return a[i];
    }
    return;
  }

  // Get the index of an element in an array by function
  function indexOf(a, fn, scope) {
    for (var i = 0, l = a.length; i < l; i++) {
      if (fn.call(scope || null, a[i]))
        return i;
    }
    return -1;
  }


  /**
   * Document Helpers
   * -----------------
   *
   * Functions to deal with DOM selection and the current document.
   */

  // Checking whether a variable is a jQuery selector
  function isSelector(v) {
    return (artoo.$ && v instanceof artoo.$) ||
           (jQuery && v instanceof jQuery) ||
           ($ && v instanceof $);
  }

  // Checking whether a variable is a DOM document
  function isDocument(v) {
    return v instanceof HTMLDocument ||
           v instanceof XMLDocument;
  }

  // Get either string or document and return valid jQuery selection
  function jquerify(v) {
    var $ = artoo.$;

    if (isDocument(v))
      return $(v);
    return $('<div />').append(v);
  }

  // Creating an HTML or XML document
  function createDocument(root, namespace) {
    if (!root)
      return document.implementation.createHTMLDocument();
    else
      return document.implementation.createDocument(
        namespace || null,
        root,
        null
      );
  }

  // Loading an external file the same way the browser would load it from page
  function getScript(url, async, cb) {
    if (typeof async === 'function') {
      cb = async;
      async = false;
    }

    var el = document.createElement('script');

    // Script attributes
    el.type = 'text/javascript';
    el.src = url;

    // Should the script be loaded asynchronously?
    if (async)
      el.async = true;

    // Defining callbacks
    el.onload = el.onreadystatechange = function() {
      if ((!this.readyState ||
            this.readyState == 'loaded' ||
            this.readyState == 'complete')) {
        el.onload = el.onreadystatechange = null;

        // Removing element from head
        artoo.mountNode.removeChild(el);

        if (typeof cb === 'function')
          cb();
      }
    };

    // Appending the script to head
    artoo.mountNode.appendChild(el);
  }

  // Loading an external stylesheet
  function getStylesheet(data, isUrl, cb) {
    var el = document.createElement(isUrl ? 'link' : 'style'),
        head = document.getElementsByTagName('head')[0];

    el.type = 'text/css';

    if (isUrl) {
      el.href = data;
      el.rel = 'stylesheet';

      // Waiting for script to load
      el.onload = el.onreadystatechange = function() {
        if ((!this.readyState ||
              this.readyState == 'loaded' ||
              this.readyState == 'complete')) {
          el.onload = el.onreadystatechange = null;

          if (typeof cb === 'function')
            cb();
        }
      };
    }
    else {
      el.innerHTML = data;
    }

    // Appending the stylesheet to head
    head.appendChild(el);
  }

  var globalsBlackList = [
    '__commandLineAPI',
    'applicationCache',
    'chrome',
    'closed',
    'console',
    'crypto',
    'CSS',
    'defaultstatus',
    'defaultStatus',
    'devicePixelRatio',
    'document',
    'external',
    'frameElement',
    'history',
    'indexedDB',
    'innerHeight',
    'innerWidth',
    'length',
    'localStorage',
    'location',
    'name',
    'offscreenBuffering',
    'opener',
    'outerHeight',
    'outerWidth',
    'pageXOffset',
    'pageYOffset',
    'performance',
    'screen',
    'screenLeft',
    'screenTop',
    'screenX',
    'screenY',
    'scrollX',
    'scrollY',
    'sessionStorage',
    'speechSynthesis',
    'status',
    'styleMedia'
  ];

  function getGlobalVariables() {
    var p = Object.getPrototypeOf(_root),
        o = {},
        i;

    for (i in _root)
      if (!~i.indexOf('webkit') &&
          !(i in p) &&
          _root[i] !== _root &&
          !(_root[i] instanceof BarProp) &&
          !(_root[i] instanceof Navigator) &&
          !~globalsBlackList.indexOf(i))
        o[i] = _root[i];

    return o;
  }


  /**
   * Async Helpers
   * --------------
   *
   * Some helpful functions to deal with asynchronous matters.
   */

  // Waiting for something to happen
  function waitFor(check, cb, params) {
    params = params || {};
    if (typeof cb === 'object') {
      params = cb;
      cb = params.done;
    }

    var milliseconds = params.interval || 30,
        j = 0;

    var i = setInterval(function() {
      if (check()) {
        clearInterval(i);
        cb(null);
      }

      if (params.timeout && params.timeout - (j * milliseconds) <= 0) {
        clearInterval(i);
        cb(new Error('timeout'));
      }

      j++;
    }, milliseconds);
  }

  // Dispatch asynchronous function
  function async() {
    var args = Array.prototype.slice.call(arguments);
    return setTimeout.apply(null, [args[0], 0].concat(args.slice(1)));
  }

  // Launching tasks in parallel with an optional limit
  function parallel(tasks, params, last) {
    var onEnd = (typeof params === 'function') ? params : params.done || last,
        running = [],
        results = [],
        d = 0,
        t,
        l,
        i;

    if (typeof onEnd !== 'function')
      onEnd = noop;

    function cleanup() {
      running.forEach(function(r) {
        clearTimeout(r);
      });
    }

    function onTaskEnd(err, result) {
      // Adding results to accumulator
      results.push(result);

      if (err) {
        cleanup();
        return onEnd(err, results);
      }

      if (++d >= tasks.length) {

        // Parallel action is finished, returning
        return onEnd(null, results);
      }

      // Adding on stack
      t = tasks[i++];
      running.push(async(t, onTaskEnd));
    }

    for (i = 0, l = params.limit || tasks.length; i < l; i++) {
      t = tasks[i];

      // Dispatching the function asynchronously
      running.push(async(t, onTaskEnd));
    }
  }


  /**
   * Monkey Patching
   * ----------------
   *
   * Some monkey patching shortcuts. Useful for sniffers and overriding
   * native functions.
   */

  function before(targetFunction, beforeFunction) {

    // Replacing the target function
    return function() {

      // Applying our function
      beforeFunction.apply(this, Array.prototype.slice.call(arguments));

      // Applying the original function
      return targetFunction.apply(this, Array.prototype.slice.call(arguments));
    };
  }


  /**
   * Exportation
   * ------------
   */

  // Exporting to artoo root
  artoo.injectScript = function(url, cb) {
    getScript(url, cb);
  };
  artoo.injectStyle = function(url, cb) {
    getStylesheet(url, true, cb);
  };
  artoo.injectInlineStyle = function(text) {
    getStylesheet(text, false);
  };
  artoo.waitFor = waitFor;
  artoo.getGlobalVariables = getGlobalVariables;

  // Exporting to artoo helpers
  artoo.helpers = {
    before: before,
    createDocument: createDocument,
    extend: extend,
    first: first,
    indexOf: indexOf,
    isArray: isArray,
    isDocument: isDocument,
    isObject: isObject,
    isPlainObject: isPlainObject,
    isRealNaN: isRealNaN,
    isSelector: isSelector,
    isNonPrimitive: isNonPrimitive,
    isPrimitive: isPrimitive,
    jquerify: jquerify,
    noop: noop,
    parallel: parallel
  };
}).call(this);

;(function(undefined) {
  'use strict';

  /**
   * artoo parsers
   * ==============
   *
   * Compilation of small parsers aim at understanding some popular web
   * string formats such as querystrings, headers etc.
   */

  function parseQueryString(s) {
    var data = {};

    s.split('&').forEach(function(item) {
      var pair = item.split('=');
      data[decodeURIComponent(pair[0])] =
        pair[1] ? decodeURIComponent(pair[1]) : true;
    });

    return data;
  }

  function parseUrl(url) {
    var data = {href: url};

    // Searching for a protocol
    var ps = url.split('://');

    if (ps.length > 1)
      data.protocol = ps[0];

    url = ps[ps.length > 1 ? 1 : 0];

    // Searching for an authentification
    var a = url.split('@');
    if (a.length > 1) {
      var as = a[0].split(':');
      if (as.length > 1) {
        data.auth = {
          user: as[0],
          password: as[1]
        };
      }
      else {
        data.auth = {
          user: as[0]
        };
      }

      url = a[1];
    }

    // Searching for origin
    var m = url.match(/([^\/:]+)(.*)/);
    data.host = m[1];
    data.hostname = m[1];

    if (m[2]) {
      var f = m[2].trim();

      // Port
      if (f.charAt(0) === ':') {
        data.port = +f.match(/\d+/)[0];
        data.host += ':' + data.port;
      }

      // Path
      data.path = '/' + f.split('/').slice(1).join('/');

      data.pathname = data.path.split('?')[0].split('#')[0];
    }

    // Tld
    if (~data.hostname.search('.')) {
      var ds = data.hostname.split('.');

      // Check for IP
      if (!(ds.length === 4 &&
          ds.every(function(i) { return !isNaN(+i); }))) {

        // Checking TLD-less urls
        if (ds.length > 1) {

          // TLD
          data.tld = ds[ds.length - 1];

          // Domain
          data.domain = ds[ds.length - 2];

          // Subdomains
          if (ds.length > 2) {
            data.subdomains = [];
            for (var i = 0, l = ds.length - 2; i < l; i++)
              data.subdomains.unshift(ds[i]);
          }
        }
        else {

          // TLD-less url
          data.domain = ds[0];
        }
      }
      else {

        // This is an IP
        data.domain = data.hostname;
      }
    }

    // Hash
    var hs = url.split('#');

    if (hs.length > 1) {
      data.hash = '#' + hs[1];
    }

    // Querystring
    var qs = url.split('?');

    if (qs.length > 1) {
      data.search = '?' + qs[1];
      data.query = parseQueryString(qs[1]);
    }

    // Extension
    var ss = data.pathname.split('/'),
        es = ss[ss.length - 1].split('.');

    if (es.length > 1)
      data.extension = es[es.length - 1];

    return data;
  }

  function parseHeaders(headers) {
    var data = {};

    headers.split('\n').filter(function(item) {
      return item.trim();
    }).forEach(function(item) {
      if (item) {
        var pair = item.split(': ');
        data[pair[0]] = pair[1];
      }
    });

    return data;
  }

  function parseCookie(s) {
    var cookie = {
      httpOnly: false,
      secure: false
    };

    if (!s.trim())
      return;

    s.split('; ').forEach(function(item) {

      // Path
      if (~item.search(/path=/i)) {
        cookie.path = item.split('=')[1];
      }
      else if (~item.search(/expires=/i)) {
        cookie.expires = item.split('=')[1];
      }
      else if (~item.search(/httponly/i) && !~item.search('=')) {
        cookie.httpOnly = true;
      }
      else if (~item.search(/secure/i) && !~item.search('=')) {
        cookie.secure = true;
      }
      else {
        var is = item.split('=');
        cookie.key = is[0];
        cookie.value = decodeURIComponent(is[1]);
      }
    });

    return cookie;
  }

  function parseCookies(s) {
    var cookies = {};

    if (!s.trim())
      return cookies;

    s.split('; ').forEach(function(item) {
      var pair = item.split('=');
      cookies[pair[0]] = decodeURIComponent(pair[1]);
    });

    return cookies;
  }

  /**
   * Exporting
   */
  artoo.parsers = {
    cookie: parseCookie,
    cookies: parseCookies,
    headers: parseHeaders,
    queryString: parseQueryString,
    url: parseUrl
  };
}).call(this);

;(function(undefined) {
  'use strict';

  /**
   * artoo writers
   * ==============
   *
   * Compilation of writers for popular formats such as CSV or YAML.
   */

  // Dependencies
  var isPlainObject = artoo.helpers.isPlainObject,
      isArray = artoo.helpers.isArray,
      isPrimitive = artoo.helpers.isPrimitive,
      isNonPrimitive = artoo.helpers.isNonPrimitive,
      isRealNaN = artoo.helpers.isRealNaN;


  /**
   * CSV
   * ---
   *
   * Converts an array of array or array of objects into a correct
   * CSV string for exports purposes.
   *
   * Exposes some handful options such as choice of delimiters or order
   * of keys to handle.
   */

  // Convert an object into an array of its properties
  function objectToArray(o, order) {
    order = order || Object.keys(o);

    return order.map(function(k) {
      return o[k];
    });
  }

  // Retrieve an index of keys present in an array of objects
  function keysIndex(a) {
    var keys = [],
        l,
        k,
        i;

    for (i = 0, l = a.length; i < l; i++)
      for (k in a[i])
        if (!~keys.indexOf(k))
          keys.push(k);

    return keys;
  }

  // Escape a string for a RegEx
  function rescape(s) {
    return s.replace(/[-\/\\^$*+?.()|[\]{}]/g, '\\$&');
  }

  // Converting an array of arrays into a CSV string
  function toCSVString(data, params) {
    params = params || {};

    var header = params.headers || [],
        plainObject = isPlainObject(data[0]),
        keys = plainObject && (params.order || keysIndex(data)),
        oData,
        i;

    // Defaults
    var escape = params.escape || '"',
        delimiter = params.delimiter || ',';

    // Dealing with headers polymorphism
    if (!header.length)
      if (plainObject && params.headers !== false)
        header = keys;

    // Should we append headers
    oData = (header.length ? [header] : []).concat(
      plainObject ?
        data.map(function(e) { return objectToArray(e, keys); }) :
        data
    );

    // Converting to string
    return oData.map(function(row) {
      return row.map(function(item) {

        // Wrapping escaping characters
        var i = ('' + (typeof item === 'undefined' ? '' : item)).replace(
          new RegExp(rescape(escape), 'g'),
          escape + escape
        );

        // Escaping if needed
        return ~i.indexOf(delimiter) || ~i.indexOf(escape) || ~i.indexOf('\n') ?
          escape + i + escape :
          i;
      }).join(delimiter);
    }).join('\n');
  }



  /**
   * YAML
   * ----
   *
   * Converts JavaScript data into a YAML string for export purposes.
   */

  // Characters to escape in YAML
  var ymlEscape = /[:#,\-\[\]\{\}&%]|!{1,2}/;

  // Creating repeating sequences
  function repeatString(string, nb) {
    var s = string,
        l,
        i;

    if (nb <= 0)
      return '';

    for (i = 1, l = nb | 0; i < l; i++)
      s += string;
    return s;
  }

  // YAML conversion
  var yml = {
    string: function(string) {
      return (~string.search(ymlEscape)) ?
        '\'' + string.replace(/'/g, '\'\'') + '\'' :
        string;
    },
    number: function(nb) {
      return '' + nb;
    },
    array: function(a, lvl) {
      lvl = lvl || 0;

      if (!a.length)
        return '[]';

      var string = '',
          l,
          i;

      for (i = 0, l = a.length; i < l; i++) {
        string += repeatString('  ', lvl);

        if (isPrimitive(a[i])) {
          string += '- ' + processYAMLVariable(a[i]) + '\n';
        }
        else {
          if (isPlainObject(a[i]))
            string += '-' + processYAMLVariable(a[i], lvl + 1, true);
          else
            string += processYAMLVariable(a[i], lvl + 1);
        }
      }

      return string;
    },
    object: function(o, lvl, indent) {
      lvl = lvl || 0;

      if (!Object.keys(o).length)
        return (lvl ? '- ' : '') + '{}';

      var string = '',
          key,
          c = 0,
          i;

      for (i in o) {
        key = yml.string(i);
        string += repeatString('  ', lvl);
        if (indent && !c)
          string = string.slice(0, -1);
        string += key + ': ' + (isNonPrimitive(o[i]) ? '\n' : '') +
          processYAMLVariable(o[i], lvl + 1) + '\n';

        c++;
      }

      return string;
    },
    fn: function(fn) {
      return yml.string(fn.toString());
    },
    boolean: function(v) {
      return '' + v;
    },
    nullValue: function(v) {
      return '~';
    }
  };

  // Get the correct handler corresponding to variable type
  function processYAMLVariable(v, lvl, indent) {

    // Scalars
    if (typeof v === 'string')
      return yml.string(v);
    else if (typeof v === 'number')
      return yml.number(v);
    else if (typeof v === 'boolean')
      return yml.boolean(v);
    else if (typeof v === 'undefined' || v === null || isRealNaN(v))
      return yml.nullValue(v);

    // Nonscalars
    else if (isPlainObject(v))
      return yml.object(v, lvl, indent);
    else if (isArray(v))
      return yml.array(v, lvl);
    else if (typeof v === 'function')
      return yml.fn(v);

    // Error
    else
      throw TypeError('artoo.writers.processYAMLVariable: wrong type.');
  }

  // Converting JavaScript variables to a YAML string
  function toYAMLString(data) {
    return '---\n' + processYAMLVariable(data);
  }


  /**
   * Web Formats
   * ------------
   *
   * Converts JavaScript data into standard web formats such as querystrings.
   */

  function toQueryString(o, fn) {
    if (!isPlainObject(o))
      throw Error('artoo.writers.queryString: wrong arguments.');

    var s = '',
        k;

    for (k in o) {
      s +=
        (s ? '&' : '') +
        k + '=' +
        encodeURIComponent(typeof fn === 'function' ? fn(o[k]) : o[k]);
    }

    return s;
  }

  function toCookie(key, value, params) {
    params = params || {};

    var cookie = key + '=' + encodeURIComponent(value);

    if (params.days) {
      var date = new Date();
      date.setTime(date.getTime() + (params.days * 24 * 60 * 60 * 1000));
      cookie += '; expires=' + date.toGMTString();
    }

    if (params.path)
      cookie += '; path=' + params.path;

    if (params.domain)
      cookie += '; domain=' + params.domain;

    if (params.httpOnly)
      cookie += '; HttpOnly';

    if (params.secure)
      cookie += '; Secure';

    return cookie;
  }


  /**
   * Exporting
   */
  artoo.writers = {
    cookie: toCookie,
    csv: toCSVString,
    queryString: toQueryString,
    yaml: toYAMLString
  };
}).call(this);

;(function(undefined) {
  'use strict';

  /**
   * artoo browser module
   * =====================
   *
   * Detects in which browser artoo is loaded and what are its capabilities
   * so he can adapt gracefully.
   */
  var _root = this,
      inBrowser = 'navigator' in _root;

  // Helpers
  function checkFirebug() {
    var firebug = true;
    for (var i in _root.console.__proto__) {
      firebug = false;
      break;
    }
    return firebug;
  }

  function checkNode() {
    return typeof window === 'undefined' &&
           typeof global !== 'undefined' &&
           typeof module !== 'undefined' &&
           module.exports;
  }

  // Browsers
  artoo.browser = {
    chrome: 'chrome' in _root,
    firefox: inBrowser && !!~navigator.userAgent.search(/firefox/i),
    phantomjs: 'callPhantom' in _root,
    nodejs: checkNode()
  };

  // Which browser?
  artoo.browser.which =
    artoo.helpers.first(Object.keys(artoo.browser), function(b) {
      return artoo.browser[b];
    }) || null;

  // Debuggers
  artoo.browser.firebug = checkFirebug();
}).call(this);

;(function(undefined) {
  'use strict';

  /**
   * artoo console abstraction
   * ==========================
   *
   * Console abstraction enabling artoo to perform a finer logging job than
   * standard one.
   */
  var _root = this,
       enhanced = artoo.browser.chrome || artoo.browser.firebug;

  // Log levels
  var levels = {
    verbose: '#33CCFF', // Cyan
    debug: '#000099',   // Blue
    info: '#009900',    // Green
    warning: 'orange',  // Orange
    error: 'red'        // Red
  };

  var priorities = ['verbose', 'debug', 'info', 'warning', 'error'];

  // Utilities
  function toArray(a, slice) {
    return Array.prototype.slice.call(a, slice || 0);
  }

  // Is the level allowed to log?
  function isAllowed(level) {
    var threshold = artoo.settings.log.level;

    if (artoo.helpers.isArray(threshold))
      return !!~threshold.indexOf(level);
    else
      return priorities.indexOf(level) >=
        priorities.indexOf(threshold);
  }

  // Return the logo ASCII array
  function robot() {
    return [
      '  .-""-.   ',
      '  /[] _ _\\  ',
      ' _|_o_LII|_ ',
      '/ | ==== | \\',
      '|_| ==== |_|',
      ' ||LI  o ||',
      ' ||\'----\'||',
      '/__|    |__\\'
    ];
  }

  // Log header
  function logHeader(level) {
    var args = ['[artoo]: ' + (enhanced ? '%c' + level : '')];

    if (enhanced)
      args.push('color: ' + levels[level] + ';');
    args.push('-' + (enhanced ? '' : ' '));

    return args;
  }

  // Log override
  artoo.log = function(level) {
    if (!artoo.settings.log.enabled)
      return;

    var hasLevel = (levels[level] !== undefined),
        slice = hasLevel ? 1 : 0,
        args = toArray(arguments, slice);

    level = hasLevel ? level : 'debug';

    // Is this level allowed?
    if (!isAllowed(level))
      return;

    var msg = logHeader(level).concat(args);

    console.log.apply(
      console,
      (enhanced) ?
        msg :
        [msg.reduce(function(a, b) { return a + b; }, '')]
    );
  };

  // Log shortcuts
  function makeShortcut(level) {
    artoo.log[level] = function() {
      artoo.log.apply(artoo.log,
        [level].concat(toArray(arguments)));
    };
  }

  for (var l in levels)
    makeShortcut(l);

  // Plain log
  artoo.log.plain = function() {
    if (artoo.settings.log.enabled)
      console.log.apply(console, arguments);
  };

  // Logo display
  artoo.log.welcome = function() {
    if (!artoo.settings.log.enabled)
      return;

    var ascii = robot();
    ascii[ascii.length - 2] = ascii[ascii.length - 2] + '    artoo.js';

    console.log(ascii.join('\n') + '   v' + artoo.version);
  };
}).call(this);

;(function(undefined) {
  'use strict';

  /**
   * artoo dependencies
   * ===================
   *
   * Gracefully inject popular dependencies into the scraped webpage.
   */
  var _root = this,
      _cached = {};

  artoo.deps = {};

  // Dependencies injection routine
  // TODO: trust and function to check version and such
  artoo.deps._inject = function(cb) {
    var deps = artoo.settings.dependencies;

    if (!deps.length)
      return cb();

    artoo.log.verbose(
      'Starting to retrieve dependencies...',
      deps.map(function(d) {
        return d.name;
      })
    );

    // Creating tasks
    var tasks = deps.map(function(d) {
      if (!d.name || !d.globals || !d.url)
        throw Error('artoo.deps: invalid dependency definition.');

      // Computing globals
      var globals = typeof d.globals === 'string' ? [d.globals] : d.globals;
      globals.forEach(function(g) {

          // Is the variable present in the global scope?
          if (_root[g] && !d.noConflict && !d.force)
            _cached[g] = _root[g];
      });

      // Creating a task
      return function(next) {

        // Script injection
        artoo.injectScript(d.url, function() {

          // Announcing
          artoo.log.verbose('Retrieved dependency ' + d.name + '.');

          // Retrieving the variables under artoo.deps
          var retrievedGlobals = {};
          globals.forEach(function(g) {

            retrievedGlobals[g] = _root[g];

            // If cached and not forced
            if (_cached[g]) {
              _root[g] = _cached[g];
              delete _cached[g];
            }

            // If noConflict and not forced
            if (d.noConflict)
              _root[g].noConflict();
          });

          // Assigning to deps
          artoo.deps[d.name] = Object.keys(retrievedGlobals).length > 1 ?
            retrievedGlobals :
            retrievedGlobals[Object.keys(retrievedGlobals)[0]];

          next();
        });
      };
    });

    artoo.helpers.parallel(tasks, function() {
      artoo.log.verbose('Finished retrieving dependencies.');
      cb();
    });
  };

  // jQuery injection routine
  artoo.jquery.inject = function(cb) {

    // Properties
    var desiredVersion = artoo.settings.jquery.version,
        cdn = '//code.jquery.com/jquery-' + desiredVersion + '.min.js';

    // Checking the existence of jQuery or of another library.
    var exists = (typeof jQuery !== 'undefined' && jQuery.fn) || artoo.$.fn,
        other = !exists && typeof $ !== 'undefined',
        currentVersion = exists && jQuery.fn.jquery ? jQuery.fn.jquery : '0';

    // jQuery is already in a correct mood
    if (exists &&
        currentVersion.charAt(0) === desiredVersion.charAt(0) &&
        currentVersion.charAt(2) === desiredVersion.charAt(2)) {
      artoo.log.verbose('jQuery already exists in this page ' +
                        '(v' + currentVersion + '). No need to load it again.');

      // Internal reference
      artoo.$ = jQuery;

      cb();
    }

    // Forcing jQuery injection, according to settings
    else if (artoo.settings.jquery.force) {
      artoo.injectScript(cdn, function() {
        artoo.log.warning('According to your settings, jQuery (v' +
                          desiredVersion + ') was injected into your page ' +
                          'to replace the current $ variable.');

        artoo.$ = jQuery;

        cb();
      });
    }

    // jQuery has not the correct version or another library uses $
    else if ((exists && currentVersion.charAt(0) !== '2') || other) {
      artoo.injectScript(cdn, function() {
        artoo.$ = jQuery.noConflict(true);

        // Then, if dollar does not exist, we set it
        if (typeof _root.$ === 'undefined') {
          _root.$ = artoo.$;

          artoo.log.warning(
            'jQuery is available but does not have a correct version. ' +
            'The correct version was therefore injected and $ was set since ' +
            'it was not used.'
          );
        }
        else {
          artoo.log.warning(
            'Either jQuery has not a valid version or another library ' +
            'using $ is already present. ' +
            'Correct version available through `artoo.$`.'
          );
        }

        cb();
      });
    }

    // jQuery does not exist at all, we load it
    else {
      artoo.injectScript(cdn, function() {
        artoo.log.info('jQuery was correctly injected into your page ' +
                       '(v' + desiredVersion + ').');

        artoo.$ = jQuery;

        cb();
      });
    }
  };
}).call(this);

;(function(undefined) {
  'use strict';

  /**
   * artoo countermeasures
   * ======================
   *
   * Compilation of artoo countermeasures against popular console hacks
   * deployed by websites to prevent javasript fiddling.
   */

  // Checking whether the console functions have been replaced by empty ones.
  // Examples: twitter, gmail
  function shuntedConsole() {

    // Detection
    if (artoo.browser.firebug ||
        ~console.log.toString().search(/\[native code\]/i))
      return;

    // The console have been shunted, repairing...
    ['log', 'info', 'debug', 'warn'].forEach(function(fn) {
      console[fn] = console.__proto__[fn];
    });

    artoo.log.warning('The console have been shunted by the website you ' +
                      'are visiting. artoo has repaired it.');
  }

  // Registering functions
  artoo.once('countermeasures', function() {
    shuntedConsole();
  });
}).call(this);

;(function(undefined) {
  'use strict';

  /**
   * artoo ajax sniffer
   * ===================
   *
   * A useful ajax request sniffer.
   */
  var _root = this,
      before = artoo.helpers.before;

  // Persistent state
  var originalXhr = {
    open: XMLHttpRequest.prototype.open,
    send: XMLHttpRequest.prototype.send,
    setRequestHeader: XMLHttpRequest.prototype.setRequestHeader
  };

  // Main abstraction
  // TODO: working criteria
  // TODO: fire exception one step above
  function AjaxSniffer() {
    var self = this;

    // Properties
    this.hooked = false;
    this.listeners = [];

    // Privates
    function hook() {
      if (self.hooked)
        return;

      // Monkey patching the 'open' method
      XMLHttpRequest.prototype.open = before(
        XMLHttpRequest.prototype.open,
        function(method, url, async) {
          var xhr = this;

          // Overloading the xhr object
          xhr._spy = {
            method: method,
            url: url,
            params: artoo.parsers.url(url).query
          };
        }
      );

      // Monkey patching the 'send' method
      XMLHttpRequest.prototype.send = before(
        XMLHttpRequest.prototype.send,
        function(data) {
          var xhr = this;

          // Overloading the xhr object
          if (data) {
            xhr._spy.querystring = data;
            xhr._spy.data = artoo.parsers.queryString(data);
          }

          // Triggering listeners
          self.listeners.forEach(function(listener) {
            if (listener.criteria === '*')
              listener.fn.call(xhr, xhr._spy);
          });
        }
      );

      self.hooked = true;
    }

    function release() {
      if (!self.hooked)
        return;

      XMLHttpRequest.prototype.send = originalXhr.send;
      XMLHttpRequest.prototype.open = originalXhr.open;

      self.hooked = false;
    }

    // Methods
    this.before = function(criteria, callback) {

      // Polymorphism
      if (typeof criteria === 'function') {
        callback = criteria;
        criteria = null;
      }

      criteria = criteria || {};

      // Hooking xhr
      hook();

      // Binding listener
      this.listeners.push({criteria: '*', fn: callback});
    };

    this.after = function(criteria, callback) {

      // Polymorphism
      if (typeof criteria === 'function') {
        callback = criteria;
        criteria = null;
      }

      criteria = criteria || {};

      // Hooking xhr
      hook();

      // Binding a deviant listener
      this.listeners.push({criteria: '*', fn: function() {
        var xhr = this,
            originalCallback = xhr.onreadystatechange;

        xhr.onreadystatechange = function() {
          if (xhr.readyState === XMLHttpRequest.prototype.DONE) {

            // Retrieving data as per response headers
            var contentType = xhr.getResponseHeader('Content-Type'),
                data = xhr.response;

            if (~contentType.search(/json/)) {
              try {
                data = JSON.parse(xhr.responseText);
              }
              catch (e) {
                // pass...
              }
            }
            else if (~contentType.search(/xml/)) {
              data = xhr.responseXML;
            }

            callback.call(xhr, xhr._spy, {
              data: data,
              headers: artoo.parsers.headers(xhr.getAllResponseHeaders())
            });
          }

          if (typeof originalCallback === 'function')
            originalCallback.apply(xhr, arguments);
        };
      }});
    };

    this.off = function(fn) {

      // Splicing function from listeners
      var index = artoo.helpers.indexOf(this.listeners, function(listener) {
        return listener.fn === fn;
      });

      // Incorrect function
      if (!~index)
        throw Error('artoo.ajaxSniffer.off: trying to remove an inexistant ' +
                    'listener.');

      this.listeners.splice(index, 1);

      // If no listeners were to remain, we release xhr
      if (!this.listeners.length)
        release();
    };
  }

  // Namespace
  artoo.ajaxSniffer = new AjaxSniffer();
}).call(this);

;(function(undefined) {
  'use strict';

  /**
   * artoo ajaxSpider method
   * ========================
   *
   * A useful method to scrape data from a list of ajax urls.
   */
  var _root = this;

  function loop(list, params, i, acc, lastData) {
    acc = acc || [];
    i = i || 0;

    var o = (typeof list === 'function') ? list(i, lastData) : list[i];

    // Breaking if iterator returns a falsy value
    if (!o)
      return params.done(acc);

    function get(c) {
      if (o.settings || params.settings)
        artoo.$.ajax(
          o.url || params.url || o,
          artoo.helpers.extend(
            o.settings || params.settings,
            {
              success: c,
              data: o.data || params.data || {},
              type: o.method || params.method || 'get'
            }
          )
        );
      else
        artoo.$[o.method || params.method || 'get'](
          o.url || params.url || o,
          o.data || params.data || {},
          c
        );
    }

    // Getting data with ajax
    if (params.throttle > 0)
      setTimeout(get, !i ? 0 : params.throttle, dataRetrieved);
    else if (typeof params.throttle === 'function')
      setTimeout(get, !i ? 0 : params.throttle(i), dataRetrieved);
    else
      get(dataRetrieved);

    function dataRetrieved(data) {

      // Applying callback on data
      var result = data;

      if (params.scrape || params.scrapeOne || params.jquerify)
        data = artoo.helpers.jquerify(data);

      if (params.scrape || params.scrapeOne) {
        result = artoo[params.scrape ? 'scrape' : 'scrapeOne'](
          data.find(params.scrape.iterator),
          params.scrape.data,
          params.scrape.params
        );
      }
      else if (typeof params.process === 'function') {
        result = params.process(data, i, acc);
      }

      // If false is returned as the callback, we break
      if (result === false)
        return params.done(acc);

      // Concat or push?
      if (params.concat)
        acc = acc.concat(result);
      else
        acc.push(result);

      // Incrementing
      i++;

      if ((artoo.helpers.isArray(list) && i === list.length) ||
          i === params.limit)
        params.done(acc);
      else
        loop(list, params, i, acc, data);
    }
  }

  // TODO: asynchronous
  artoo.ajaxSpider = function(list, params, cb) {
    var fn,
        p;

    // Default
    params = params || {};

    // If only callback
    if (typeof params === 'function') {
      fn = params;
      params = {};
      params.done = fn;
    }

    // Dealing with callback polymorphism
    if (typeof cb === 'function')
      p = artoo.helpers.extend({done: cb}, params);

    loop(list, artoo.helpers.extend(p || params, {done: artoo.helpers.noop}));
  };
}).call(this);

;(function(undefined) {
  'use strict';

  /**
   * artoo autoExpand methods
   * =========================
   *
   * Some useful functions to expand programmatically some content in
   * the scraped web page.
   */
  var _root = this;

  function _expand(params, i, c) {
    i = i || 0;

    var canExpand = (params.canExpand) ?
      (typeof params.canExpand === 'string' ?
        artoo.$(params.canExpand).length > 0 :
        params.canExpand(artoo.$)) :
      true;

    // Is this over?
    if (!canExpand || i >= params.limit) {
      if (typeof params.done === 'function')
        params.done();
      return;
    }

    // Triggering expand
    var expandFn = (typeof params.expand === 'string') ?
      function() {
        artoo.$(params.expand).simulate('click');
      } :
      params.expand;

    if (params.throttle)
      setTimeout(
        expandFn,
        typeof params.throttle === 'function' ?
          params.throttle(i) :
          params.throttle,
        artoo.$
      );
    else
      expandFn(artoo.$);

    // Waiting expansion
    if (params.isExpanding) {

      // Checking whether the content is expanding and waiting for it to end.
      if (typeof params.isExpanding === 'number') {
        setTimeout(_expand, params.isExpanding, params, ++i);
      }
      else {
        var isExpanding = (typeof params.isExpanding === 'string') ?
          function() {
            return artoo.$(params.isExpanding).length > 0;
          } :
          params.isExpanding;

        artoo.waitFor(
          function() {
            return !isExpanding(artoo.$);
          },
          function() {
            _expand(params, ++i);
          },
          {timeout: params.timeout}
        );
      }
    }
    else if (params.elements) {
      c = c || artoo.$(params.elements).length;

      // Counting elements to check if those have changed
      artoo.waitFor(
        function() {
          return artoo.$(params.elements).length > c;
        },
        function() {
          _expand(params, ++i, artoo.$(params.elements).length);
        },
        {timeout: params.timeout}
      );
    }
    else {

      // No way to assert content changes, continuing...
      _expand(params, ++i);
    }
  }

  // TODO: throttle (make wrapper with setTimeout)
  artoo.autoExpand = function(params, cb) {
    params = params || {};
    params.done = cb || params.done;

    if (!params.expand)
      throw Error('artoo.autoExpand: you must provide an expand parameter.');

    _expand(params);
  };
}).call(this);

;(function(undefined) {
  'use strict';

  /**
   * artoo autoScroll methods
   * =========================
   *
   * Some useful functions to scroll programmatically the web pages you need
   * to scrape.
   */
  var _root = this;

  artoo.autoScroll = function(params, cb) {
    artoo.autoExpand(
      this.helpers.extend(params, {
        expand: function() {
          window.scrollTo(0, document.body.scrollHeight);
        }
      }),
      cb
    );
  };
}).call(this);

;(function(undefined) {
  'use strict';

  /**
   * artoo cookies methods
   * ======================
   *
   * artoo's abstraction to handle the page's cookies.
   */
  var _root = this;

  artoo.cookies = function(key) {
    return artoo.cookies.get(key);
  };

  artoo.cookies.get = function(key) {
    var cookies = artoo.parsers.cookies(document.cookie);
    return (key ? cookies[key] : cookies);
  };

  artoo.cookies.getAll = function() {
    return artoo.cookies.get();
  };

  artoo.cookies.set = function(key, value, params) {
    document.cookie = artoo.writers.cookie(key, value, params);
  };

  artoo.cookies.remove = function(key, params) {
    var p = artoo.helpers.extend(params);

    // Ensuring no days were passed
    delete p.days;

    var cookie = artoo.writers.cookie(key, '*', p);

    // Passed expiration
    cookie += ' ;expires=Thu, 01 Jan 1970 00:00:01 GMT';

    document.cookie = cookie;
  };

  artoo.cookies.removeAll = function() {
    var cookies = artoo.cookies.getAll(),
        k;

    for (k in cookies)
      artoo.cookies.remove(k);
  };

  artoo.cookies.clear = artoo.cookies.removeAll;
}).call(this);

;(function(undefined) {
  'use strict';

  /**
   * artoo save methods
   * ===================
   *
   * Some helpers to save data to a file that will be downloaded by the
   * browser. Works mainly with chrome for the time being.
   *
   */
  var _root = this,
      helpers = artoo.helpers;

  // Polyfills
  var URL = _root.URL || _root.webkitURL || _root;

  // Utilities
  function selectorOuterHTML($sel) {
    return ($sel[0].documentElement && $sel[0].documentElement.outerHTML) ||
           $sel[0].outerHTML;
  }

  function filenamePolymorphism(params) {
    return (typeof params === 'string') ? {filename: params} : params || {};
  }

  // Main abstraction
  function Saver() {
    var _saver;

    // Properties
    this.defaultFilename = 'artoo_data';
    this.defaultEncoding = 'utf-8';
    this.xmlns = 'http://www.w3.org/1999/xhtml';
    this.mimeShortcuts = {
      csv: 'text/csv',
      tsv: 'text/tab-separated-values',
      json: 'application/json',
      txt: 'text/plain',
      html: 'text/html',
      yaml: 'text/yaml'
    };

    // Methods
    this.createBlob = function(data, mime, encoding) {
      mime = this.mimeShortcuts[mime] || mime || this.defaultMime;
      return new Blob(
        [data],
        {type: mime + ';charset=' + encoding || this.defaultEncoding}
      );
    };

    this.createBlobFromDataURL = function(url) {
      var byteString = atob(url.split(',')[1]),
          ba = new Uint8Array(byteString.length),
          i,
          l;

      for (i = 0, l = byteString.length; i < l; i++)
        ba[i] = byteString.charCodeAt(i);

      return new Blob([ba.buffer], {
        type: url.split(',')[0].split(':')[1].split(';')[0]
      });
    };

    this.blobURL = function(blob) {
      var oURL = URL.createObjectURL(blob);
      return oURL;
    };

    this.saveResource = function(href, params) {
      var a = document.createElementNS(this.xmlns, 'a');
      a.href = href;

      a.setAttribute('download', params.filename || '');

      artoo.$(a).simulate('click');
      a = null;

      // Revoking the object URL if we want to
      if (params.revoke)
        URL.revokeObjectURL(href);
    };

    // Main interface
    this.saveData = function(data, params) {
      params = params || {};

      // Creating the blob
      var blob = this.createBlob(data, params.mime, params.encoding);

      // Saving the blob
      this.saveResource(
        this.blobURL(blob),
        {
          filename: params.filename || this.defaultFilename,
          revoke: params.revoke || true
        }
      );
    };

    this.saveDataURL = function(url, params) {
      params = params || {};

      // Creating the blob
      var blob = this.createBlobFromDataURL(url);

      // Saving the blob
      this.saveResource(
        blob,
        {filename: params.filename || this.defaultFilename}
      );
    };
  }

  var _saver = new Saver();

  // Exporting
  artoo.save = function(data, params) {
    _saver.saveData(data, filenamePolymorphism(params));
  };

  artoo.saveJson = function(data, params) {
    params = filenamePolymorphism(params);

    // Enforcing json
    if (typeof data !== 'string') {
      if (params.pretty || params.indent)
        data = JSON.stringify(data, undefined, params.indent || 2);
      else
        data = JSON.stringify(data);
    }
    else {
      if (params.pretty || params.indent)
        data = JSON.stringify(JSON.parse(data), undefined, params.indent || 2);
    }

    // Extending params
    artoo.save(
      data,
      helpers.extend(params, {filename: 'data.json', mime: 'json'})
    );
  };

  artoo.savePrettyJson = function(data, params) {
    params = filenamePolymorphism(params);
    artoo.saveJson(data, helpers.extend(params, {pretty: true}));
  };

  artoo.saveYaml = function(data, params) {
    params = filenamePolymorphism(params);
    artoo.save(
      artoo.writers.yaml(data),
      helpers.extend(params, {filename: 'data.yml', mime: 'yaml'})
    );
  };

  artoo.saveCsv = function(data, params) {
    params = filenamePolymorphism(params);

    data = (typeof data !== 'string') ?
      artoo.writers.csv(data, params) :
      data;

    artoo.save(
      data,
      helpers.extend(params, {mime: 'csv', filename: 'data.csv'})
    );
  };

  artoo.saveTsv = function(data, params) {
    artoo.saveCsv(
      data,
      helpers.extend(filenamePolymorphism(params), {
        mime: 'tsv',
        delimiter: '\t',
        filename: 'data.tsv'
      })
    );
  };

  artoo.saveXml = function(data, params) {
    params = filenamePolymorphism(params);

    var s = (helpers.isSelector(data) && selectorOuterHTML(data)) ||
            (helpers.isDocument(data) && data.documentElement.outerHTML) ||
            data,
        type = params.type || 'xml',
        header = '';

    // Determining doctype
    if (type === 'html' && helpers.isDocument(data)) {
      var dt = data.doctype;

      if (dt)
        header = '<!DOCTYPE ' + (dt.name || 'html') +
                 (dt.publicId ? ' PUBLIC "' + dt.publicId + '"' : '') +
                 (dt.systemId ? ' "' + dt.systemId + '"' : '') + '>\n';
    }
    else if (type === 'xml' || type === 'svg') {
      if (!~s.search(/<\?xml/))
        header = '<?xml version="1.0" encoding="' +
                 (params.encoding || 'utf-8') +
                 '" standalone="yes"?>\n';
    }

    if (type === 'svg') {
      header += '<!DOCTYPE svg PUBLIC "-//W3C//DTD SVG 1.1//EN" ' +
                '"http://www.w3.org/Graphics/SVG/1.1/DTD/svg11.dtd">\n';
    }

    artoo.save(
      header + s,
      helpers.extend(
        params,
        {mime: 'html', filename: 'document.xml'})
    );
  };

  artoo.saveHtml = function(data, params) {
    artoo.saveXml(
      data,
      helpers.extend(
        filenamePolymorphism(params),
        {filename: 'document.html', type: 'html'}
      )
    );
  };

  artoo.savePageHtml = function(params) {
    artoo.saveHtml(
      document,
      helpers.extend(filenamePolymorphism(params), {filename: 'page.html'})
    );
  };

  artoo.saveSvg = function(sel, params) {
    params = filenamePolymorphism(params);

    var $sel = artoo.$(sel);
    if (!$sel.is('svg'))
      throw Error('artoo.saveSvg: selector is not svg.');

    artoo.saveXml(
      $sel,
      helpers.extend(params, {filename: 'drawing.svg', type: 'svg'})
    );
  };

  artoo.saveStore = function(params) {
    params = filenamePolymorphism(params);
    artoo.savePrettyJson(
      artoo.store.get(params.key),
      helpers.extend(params, {filename: 'store.json'})
    );
  };

  artoo.saveResource = function(url, params) {
    _saver.saveResource(url, filenamePolymorphism(params));
  };

  artoo.saveImage = function(sel, params) {
    params = filenamePolymorphism(params);

    var $sel = artoo.$(sel);

    if (!$sel.is('img') && !$sel.attr('src'))
      throw Error('artoo.saveImage: selector is not an image.');

    var ext = helpers.getExtension($sel.attr('src')),
        alt = $sel.attr('alt');

    artoo.saveResource(
      $sel.attr('src'),
      helpers.extend(
        params,
        {
          filename: alt ? alt + (ext ? '.' + ext : '') : false
        }
      )
    );
  };
}).call(this);

;(function(undefined) {
  'use strict';

  /**
   * artoo scrape methods
   * =====================
   *
   * Some scraping helpers.
   */
  var _root = this,
      extend = artoo.helpers.extend;

  /**
   * Helpers
   */
  function step(o, scope) {
    var $ = artoo.$,
        $sel = o.sel ? $(scope).find(o.sel) : $(scope),
        val;

    // Polymorphism
    if (typeof o === 'function') {
      val = o.call(scope, $);
    }
    else if (typeof o.method === 'function')
      val = o.method.call($sel.get(), $);
    else if (typeof o === 'string') {
      if (typeof $sel[o] === 'function')
        val = $sel[o]();
      else
        val = $sel.attr(o);
    }
    else {
      val = (o.attr !== undefined) ?
        $sel.attr(o.attr) :
        $sel[o.method || 'text']();
    }

    // Default value?
    if (o.defaultValue && !val)
      val = o.defaultValue;

    return val;
  }

  // Scraping function after polymorphism has been taken care of
  function scrape(iterator, data, params, cb) {
    var $ = artoo.$,
        scraped = [],
        loneSelector = !!data.attr || !!data.method || data.scrape ||
                       typeof data === 'string' ||
                       typeof data === 'function';

    params = params || {};

    // Transforming to selector
    var $iterator;
    if (typeof iterator === 'function')
      $iterator = $(iterator($));
    else
      $iterator = $(iterator);

    // Iteration
    $iterator.each(function(i) {
      var item = {},
          p;

      // TODO: figure iteration scope elsewhere for scrape recursivity
      if (loneSelector)
        item = (typeof data === 'object' && 'scrape' in data) ?
          scrape(
            (data.sel ? $(this).find(data.sel) : $(this))
              .find(data.scrape.iterator),
            data.scrape.data,
            data.scrape.params
          ) :
          step(data, this);
      else
        for (p in data) {
          item[p] = (typeof data[p] === 'object' && 'scrape' in data[p]) ?
            scrape(
              (data[p].sel ? $(this).find(data[p].sel) : $(this))
                .find(data[p].scrape.iterator),
              data[p].scrape.data,
              data[p].scrape.params
            ) :
            step(data[p], this);
        }

      scraped.push(item);

      // Breaking if limit i attained
      return !params.limit || i < params.limit - 1;
    });

    scraped = params.one ? scraped[0] : scraped;

    // Triggering callback
    if (typeof cb === 'function')
      cb(scraped);

    // Returning data
    return scraped;
  }

  // Function taking care of harsh polymorphism
  function polymorphism(iterator, data, params, cb) {
    var h = artoo.helpers,
        i, d, p, c;

    if (h.isPlainObject(iterator) &&
        !h.isSelector(iterator) &&
        !h.isDocument(iterator) &&
        (iterator.iterator || iterator.data || iterator.params)) {
      d = iterator.data;
      p = h.isPlainObject(iterator.params) ? iterator.params : {};
      i = iterator.iterator;
    }
    else {
      d = data;
      p = h.isPlainObject(params) ? params : {};
      i = iterator;
    }

    // Default values
    d = d || 'text';

    c = typeof cb === 'function' ? cb :
          typeof params === 'function' ? params :
            p.done;

    return [i, d, p, c];
  }

  /**
   * Public interface
   */
  artoo.scrape = function(iterator, data, params, cb) {
    var args = polymorphism(iterator, data, params, cb);

    // Warn if no iterator or no data
    if (!args[0] || !args[1])
      throw TypeError('artoo.scrape: wrong arguments.');

    return scrape.apply(this, args);
  };

  // Scrape only the first corresponding item
  artoo.scrapeOne = function(iterator, data, params, cb) {
    var args = polymorphism(iterator, data, params, cb);

    // Extending parameters
    args[2] = artoo.helpers.extend(args[2], {limit: 1, one: true});

    return scrape.apply(this, args);
  };

  // Scrape a table
  // TODO: handle different contexts
  // TODO: better header handle
  artoo.scrapeTable = function(root, params, cb) {
    params = params || {};

    var sel = typeof root !== 'string' ? root.selector : root,
        headers;

    if (!params.headers) {
      return artoo.scrape(sel + ' tr:has(td)', {
        scrape: {
          iterator: 'td',
          data: params.data || 'text'
        }
      }, params, cb);
    }
    else {
      var headerType = params.headers.type ||
                       params.headers.method && 'first' ||
                       params.headers,
          headerFn = params.headers.method;

      if (headerType === 'th') {
        headers = artoo.scrape(
          sel + ' th', headerFn || 'text'
        );
      }
      else if (headerType === 'first') {
        headers = artoo.scrape(
          sel + ' tr:has(td):first td',
          headerFn || 'text'
        );
      }
      else if (artoo.helpers.isArray(headerType)) {
        headers = headerType;
      }
      else {
        throw TypeError('artoo.scrapeTable: wrong headers type.');
      }

      // Scraping
      return artoo.scrape(
        sel + ' tr:has(td)' +
        (headerType === 'first' ? ':not(:first)' : ''), function() {
          var o = {};

          headers.forEach(function(h, i) {
            o[h] = step(
              params.data || 'text',
              $(this).find('td:eq(' + i + ')')
            );
          }, this);

          return o;
        }, params, cb);
    }
  };

  /**
   * jQuery plugin
   */
  function _scrape($) {
    var methods = ['scrape', 'scrapeOne', 'scrapeTable'];

    methods.forEach(function(method) {

      $.fn[method] = function() {
        return artoo[method].apply(
          artoo, [$(this)].concat(Array.prototype.slice.call(arguments)));
      };
    });
  }

  // Exporting
  artoo.jquery.plugins.push(_scrape);

}).call(this);

;(function(undefined) {
  'use strict';

  /**
   * artoo store methods
   * ====================
   *
   * artoo's abstraction of browser storages.
   */
  var _root = this;

  // Utilities
  function isCache(key) {
    var d = artoo.settings.cache.delimiter;
    return key.charAt(0) === d && key.charAt(key.length - 1) === d;
  }

  /**
   * Abstract factory for synchronous stores
   * ----------------------------------------
   *
   * Return an helper function to access simple HTML5 storages such as
   * localStorage and sessionStorage.
   *
   * Unfortunately, those storages are limited by the same-origin policy.
   */
  function StoreFactory(engine) {

    // Initialization
    if (engine === 'local')
      engine = localStorage;
    else if (engine === 'session')
      engine = sessionStorage;
    else
      throw Error('artoo.store: wrong engine "' + engine + '".');

    // Returning a function
    var store = function(key) {
      return store.get(key);
    };

    // Methods
    store.get = function(key) {
      if (!key)
        return store.getAll();

      var v = engine.getItem(key);
      try {
        return JSON.parse(v);
      }
      catch (e) {
        return v;
      }
    };

    store.getAll = function() {
      var s = {};
      for (var i in engine) {
        if (!isCache(i))
        s[i] = store.get(i);
      }
      return s;
    };

    store.keys = function(key) {
      var keys = [],
          i;
      for (i in engine)
        keys.push(i);

      return keys;
    };

    store.set = function(key, value) {
      if (typeof key !== 'string' && typeof key !== 'number')
        throw TypeError('artoo.store.set: trying to set an invalid key.');

      // Storing
      engine.setItem(key, JSON.stringify(value));
    };

    store.pushTo = function(key, value) {
      var a = store.get(key);

      if (!artoo.helpers.isArray(a) && a !== null)
        throw TypeError('artoo.store.pushTo: trying to push to a non-array.');

      a = a || [];
      a.push(value);
      store.set(key, a);
      return a;
    };

    store.update = function(key, object) {
      var o = store.get(key);

      if (!artoo.helpers.isPlainObject(o) && o !== null)
        throw TypeError('artoo.store.update: trying to udpate to a non-object.');

      o = artoo.helpers.extend(object, o);
      store.set(key, o);
      return o;
    };

    store.remove = function(key) {

      if (typeof key !== 'string' && typeof key !== 'number')
        throw TypeError('artoo.store.set: trying to remove an invalid key.');

      engine.removeItem(key);
    };

    store.removeAll = function() {
      for (var i in engine) {
        if (!isCache(i))
          engine.removeItem(i);
      }
    };

    store.clear = store.removeAll;

    return store;
  }

  // Exporting factory
  artoo.createStore = StoreFactory;

  // Creating artoo's default store to be used
  artoo.store = StoreFactory(artoo.settings.store.engine);

  // Shortcuts
  artoo.s = artoo.store;
}).call(this);

;(function(undefined) {
  'use strict';

  /**
   * artoo ui
   * =========
   *
   * A handy utility to create shadow DOM interfaces on the fly.
   */
  var _root = this;

  // Persistent state
  var COUNTER = 0,
      INSTANCES = {};

  // Main Class
  artoo.ui = function(params) {
    params = params || {};

    var id = params.id || 'artoo-ui' + (COUNTER++);

    // Referencing the instance
    this.name = params.name || id;
    INSTANCES[this.name] = this;

    // Creating a host
    this.mountNode = params.mountNode || artoo.mountNode;
    this.host = document.createElement('div');
    this.host.setAttribute('id', id);
    this.mountNode.appendChild(this.host);

    // Properties
    this.shadow = this.host.createShadowRoot();

    // Methods
    function init() {
      var stylesheets = params.stylesheets || params.stylesheet;
      if (stylesheets) {
        (artoo.helpers.isArray(stylesheets) ?
          stylesheets : [stylesheets]).forEach(function(s) {
          this.injectStyle(s);
        }, this);
      }
    }

    this.$ = function(sel) {
      return !sel ?
        artoo.$(this.shadow) :
        artoo.$(this.shadow).children(sel).add(
          artoo.$(this.shadow).children().find(sel)
        );
    };

    this.injectStyle = function(name) {
      if (!(name in artoo.stylesheets))
        throw Error('artoo.ui.injectStyle: attempting to inject unknown ' +
                    'stylesheet (' + name +')');

      this.injectInlineStyle(artoo.stylesheets[name]);
    };

    this.injectInlineStyle = function(style) {

      // Creating a style tag
      var e = document.createElement('style');
      e.innerHTML = (artoo.helpers.isArray(style)) ?
        style.join('\n') :
        style;

      // Appending to shadow
      this.shadow.appendChild(e);

      // Returning instance for chaining
      return this;
    };

    this.kill = function() {
      this.mountNode.removeChild(this.host);
      delete this.shadow;
      delete this.host;
      delete INSTANCES[this.name];
    };

    // Initializing
    init.call(this);
  };

  // Instances accessor
  artoo.ui.instances = function(key) {
    return key ? INSTANCES[key] : INSTANCES;
  };
}).call(this);

;(function(undefined) {
  'use strict';

  /**
   * artoo initialization
   * =====================
   *
   * artoo's inititialization routine.
   */
  var _root = this;

  // Script evaluation function
  var firstExec = true;
  function exec() {

    // Should we reExec?
    if (!artoo.settings.reExec && !firstExec) {
      artoo.log.warning('not reexecuting script as per settings.');
      return;
    }

    // Evaluating or invoking distant script?
    if (artoo.settings.eval) {
      artoo.log.verbose('evaluating and executing the script given to artoo.');
      eval.call(_root, JSON.parse(artoo.settings.eval));
    }
    else if (artoo.settings.scriptUrl) {
      artoo.log.verbose('executing script at "' +
                        artoo.settings.scriptUrl + '"');
      artoo.injectScript(artoo.settings.scriptUrl);
    }

    firstExec = false;
  }

  // Initialization function
  function main() {

    // Triggering countermeasures
    artoo.emit('countermeasures');

    // Welcoming user
    if (artoo.settings.log.welcome)
      artoo.log.welcome();

    // Should we greet the user with a joyful beep?
    var beeping = artoo.settings.log.beeping;
    if (beeping)
      artoo.beep.greet();

    // Indicating we are injecting artoo from the chrome extension
    if (artoo.browser.chromeExtension)
      artoo.log.verbose('artoo has automatically been injected ' +
                        'by the chrome extension.');

    // If in phantom, dependencies are loaded synchronously
    if (artoo.browser.phantomjs) {
      artoo.$ = window.artooPhantomJQuery;
      delete window.artooPhantomJQuery;
      artoo.jquery.applyPlugins();
      return artoo.emit('ready');
    }


    // Injecting dependencies
    function injectJquery(cb) {
      artoo.jquery.inject(function() {

        // Applying jQuery plugins
        artoo.jquery.applyPlugins();

        cb();
      });
    }

    artoo.helpers.parallel(
      [injectJquery, artoo.deps._inject],
      function() {
        artoo.log.info('artoo is now good to go!');

        // Triggering exec
        if (artoo.settings.autoExec)
          artoo.exec();

        // Triggering ready
        artoo.emit('ready');
      }
    );

    // Updating artoo state
    artoo.loaded = true;
  }

  // Retrieving settings from script tag
  var dom = document.getElementById('artoo_injected_script');

  if (dom) {
    artoo.loadSettings(JSON.parse(dom.getAttribute('settings')));
    dom.parentNode.removeChild(dom);
  }

  // Updating artoo.browser
  artoo.browser.chromeExtension = !!artoo.settings.chromeExtension;

  // Adding functions to hooks
  artoo.once('init', main);
  artoo.on('exec', exec);

  // artoo initialization
  artoo.init = function() {
    artoo.emit('init');
  };

  // artoo exectution
  artoo.exec = function() {
    artoo.emit('exec');
  };

  // Init?
  if (artoo.settings.autoInit)
    artoo.init();
}).call(this);

;(function(undefined) {
  'use strict';

  /**
   * artoo phantom bridging
   * =======================
   *
   * Useful functions to send and receive data when spawned into a phantom.js
   * instance.
   */
  var _root = this,
      passphrase = 'detoo';

  // Safeguard
  if (!artoo.browser.phantomjs)
    throw Error('artoo.phantom: not in a phantom.js instance.');

  // Namespacing
  artoo.phantom = {};

  // Sending data to phantom
  artoo.phantom.send = function(head, body) {
    _root.callPhantom({head: head, body: body, passphrase: passphrase});
  };

  // Phantom notifying something to us
  artoo.phantom.notify = function(head, body) {
    artoo.emit('phantom:' + head, body);
  };

  // Killing phantom from the page for testing purposes
  artoo.phantom.exit = function(code) {
    artoo.phantom.send('exit', code);
  };

  // Streaming data to phantom
  artoo.phantom.stream = function(data) {
    artoo.phantom.send('stream', data);
  };

  // Telling phantom the scraping is over
  artoo.phantom.done = function(err, data) {
    artoo.phantom.send('done', {error: err, data: data});
  };

  // Alias
  artoo.done = artoo.phantom.done;
}).call(this);
