/*!
 * jQuery onMutate plugin v1.3-dev
 * http://jquery.com/
 *
 * Copyright 2014 CROmetrics
 * Released under the MIT license
 * https://github.com/eclecto/jQuery-onCreate/blob/master/LICENSE
 *
 * Date: 2014-12-26T16:10Z
 */

(function ($, MutationObserver, document, window) {
  var cbid = 0;

  // Uncomment this to easily test the setInterval fallback.
  // MutationObserver = false;

  // Constants for mutation types.
  var CREATE = 'create',
    MODIFY = 'modify',
    TEXT = 'text';

  // Observer class.
  function Observer(mutcallback) {
    var realObserver;

    // MutationObserver.observe() polyfill
    this.observe = function (element, init) {
      if (MutationObserver) {
        realObserver = realObserver || new MutationObserver(mutcallback);
        realObserver.observe(element, init);
      } else {
        realObserver = setInterval(mutcallback, 50);
      }
    };

    // MutationObserver.disconnect() polyfill
    this.disconnect = function () {
      if (realObserver) {
        if (MutationObserver) {
          realObserver.disconnect();
        } else {
          clearInterval(realObserver);
        }
      }
    };
  }
  
  // Callback class to wrap a callback and its properties
  function Callback(callback, conditions, multi) {
    this.callback = callback;
    this.conditions = conditions;
    this.multi = multi || false;
    this.cbid = cbid++;
    this.processed = $([]);
  }

  // Create a map of an element's attributes so we can poll for changes (non-MutationObserver browsers)
  function attributeMap(element) {
    var map = {};

    if (element.attributes) {
      $.each(element.attributes, function (index, attr) {
        map[attr.name] = attr.value;
      });
    }

    return map;
  }

  // Returns a set of MutationRecord-like objects by comparing two attribute maps.
  function mapCompare(map1, map2) {
    var mutations = [];
    $.each(map1, function (key, value) {
      if (typeof (map2[key]) === 'undefined' || value !== map2[key]) {
        mutations.push({
          attributeName: key
        });
      }
    });
    $.each(map2, function (key, value) {
      if (typeof (map1[key]) === 'undefined') {
        mutations.push({
          attributeName: key
        });
      }
    });
    return mutations;
  }
  
  // Check attributes
  function checkAttrs(mutation, $el, callback) {
    var attrname = mutation.attributeName,
        attrval = $el.attr(attrname),
        conditions = callback.conditions || false,
        attrs = conditions ? conditions[0] : false,
        match = conditions && conditions[1] ? conditions[1] : false;
    // If no attrs are set or the mutation affects one of the targeted attributes
    if (!attrs || attrs.indexOf(attrname) > -1) {
      if (match) {
        return (attrval.search(match) >= 0);
      } else {
        return true;
      }
    }    
    return false;
  }


  // Possible methods to invoke with $().on[Create|Modify|Text]()
  var methods = {
    // Attach observers.
    attach: function (options) {
      var type = options.type,
        callback = options.callback,
        multi = options.multi || false,
        conditions = options.conditions;

      // Get/initiate the element's onMutate data.
      this.data('onMutate') || this.data('onMutate', {
        create: {
          callbacks: [],
          ignore: false
        },
        modify: {
          callbacks: [],
          ignore: false
        },
        text: {
          callbacks: [],
          ignore: false
        }
      });
      var om = this.data('onMutate')[type],
        callbacks = om.callbacks,
        // Add the callback to the array of callbacks for the current type.
        newcb = new Callback(callback, conditions, multi);
      callbacks.unshift(newcb);

      // Store the element's current text or attributes if needed.
      if (!MutationObserver && type === MODIFY) {
        om.attributeMap = attributeMap(this[0]);
      }
      if (type === TEXT) om.text = this.text();

      var $this = this,
        i, changematch;

        // Define our callback for when a mutation is detected.
        mutcallback = om.mutcallback = om.mutcallback || function (mutations) {
          callbacks = om.callbacks; // Refresh the callback list.
          // Ignore any DOM changes that this callback makes to prevent infinite loops.
          if (!om.ignore) {
            om.ignore = true;
          } else {
            return;
          }
          // Find elements that have not already been processed by this observer.
          var selected = type === CREATE ? $(conditions, $this) : $this;

          if (selected.length > 0) {
            var newmap, newtext;
            if (type === MODIFY) newmap = attributeMap($this[0]);
            if (type === TEXT) newtext = $this.text();

            for (i = callbacks.length - 1; i >= 0; i--) {
              var proc = callbacks[i].processed;
              var elements = selected.not(proc);

              // Validate changed attributes for modify observers.
              if (type === MODIFY) {
                changematch = false;
                if (!MutationObserver) {
                  mutations = mapCompare(newmap, om.attributeMap);
                }
                for (var j = 0; j < mutations.length; j++) {
                  changematch = changematch || checkAttrs(mutations[j], $this, callbacks[i]);
                };
              }

              // Compare the text contents of the element to its original text.
              if (type === TEXT) {
                changematch = false;
                var cond = callbacks[i].conditions;
                if (newtext !== om.text) {
                  if (cond) {
                    changematch = newtext.search(cond) > -1;
                  } else {
                    changematch = true;
                  }
                }
              }

              if (elements.length > 0 && (type === CREATE || changematch)) {
                if (type === CREATE) proc = proc.add(elements);
                callbacks[i].callback.call($this, elements);
                // Remove callback from the list if it only runs once.
                if (!callbacks[i].multi) {
                  callbacks.splice(i, 1);
                }
              }
            }          
            // Update the current values, accounting for any changes the callback(s) might have made.
            if (type === MODIFY) om.attributeMap = attributeMap($this[0]);
            if (type === TEXT) om.text = $this.text();
          }

          // We've safely iterated through the callbacks, so don't ignore this master Callback anymore.
          // Additional mutation events apparently fire after this entire function, so we set ignore to false with an extremely small delay.
          if (om.ignore) setTimeout(function () {
            om.ignore = false;
          }, 1);
          if (callbacks.length === 0) {
            if (observer) {
              observer.disconnect();
            } else {
              return true;
            }
          }
        };
      // Sanity Check: If this is a create listener, run the callback on initialization to see if there is already a valid element.
      if (type === CREATE && mutcallback()) {
        return this;
      }

      var observer = om.observer = om.observer || new Observer(mutcallback),
        init;
      switch (type) {
      case CREATE:
        init = {
          childList: true,
          subtree: true
        };
        break;
      case MODIFY:
        init = {
          attributes: true
        };
        if (conditions) {
          init.attributeFilter = conditions[0].split(' ');
        }
        break;
      case TEXT:
        init = {
          childList: true,
          characterData: true,
          subtree: true
        };
        break;
      }
      observer.observe($this[0], init);
      return this;
    },

    // Detach observers.
    detach: function (options) {
      if (!this.data('onMutate')) return this;

      var type = options.type,
        om = this.data('onMutate')[type],
        callbacks = om.callbacks,
        callback = options.callback;
      if (callback) {
        for (var i = callbacks.length - 1; i >= 0; i--) {
          if (callbacks[i].callback.prototype.cbid === callback.prototype.cbid) {
            callbacks.splice(i, i + 1);
          }
        }
      } else {
        om.callbacks = [];
      }
      if (!callbacks.length) {
        om.observer.disconnect();
      }
      return this;
    }
  };

  $.fn.extend({
    // $(parent).onCreate(selector, callback[, multi]);
    onCreate: function () {

      var args = Array.prototype.slice.call(arguments);

      // Invalid argument
      if (typeof (args[0]) !== 'string') {
        return this;
      }

      if (args[0] === 'detach') {
        return methods.detach.call(this, {
          type: CREATE,
          callback: args[1]
        });
      } else
      // Default init functionality.
      if (typeof (args[0]) === 'string' && typeof (args[1]) === 'function') {
        return methods.attach.call(this, {
          type: CREATE,
          conditions: args[0],
          callback: args[1],
          multi: args[2]
        });
      } else {
        return this;
      }
    },

    // onModify. Usage: .onModify([attributes[, match,]] callback, multi)
    onModify: function () {

      var args = Array.prototype.slice.call(arguments),
        method;
      if (methods[args[0]]) {
        method = args.shift();
      } else {
        method = 'attach';
      }

      if (typeof (args[0]) === 'function') {
        return methods[method].call(this, {
          type: MODIFY,
          callback: args[0],
          multi: args[1]
        });
      } else if (typeof (args[0]) === 'string') {
        if (typeof (args[1]) === 'function') {
          return methods[method].call(this, {
            type: MODIFY,
            conditions: [args[0]],
            callback: args[1],
            multi: args[2]
          });
        } else if (typeof (args[1]) === 'string' || args[1] instanceof RegExp) {
          return methods[method].call(this, {
            type: MODIFY,
            conditions: [args[0], args[1]],
            callback: args[2],
            multi: args[3]
          });
        }
      } else if (method === 'attach') {
        return this;
      } else {
        methods[method].call(this, {
          type: MODIFY
        });
      }
    },

    // onText. Usage: onText([match,] callback, multi);
    onText: function () {
      if (this.length === 0) {
        debug("OnModify: Empty object received.");
        return this;
      }

      var args = Array.prototype.slice.call(arguments),
        method;

      if (methods[args[0]]) {
        method = args.shift();
      } else {
        method = 'attach';
      }

      if (typeof (args[0]) === 'function') {
        return methods[method].call(this, {
          type: TEXT,
          callback: args[0],
          multi: args[1]
        });
      } else if (typeof (args[0]) === 'string' || args[0] instanceof RegExp && typeof (args[1]) === 'function') {
        return methods[method].call(this, {
          type: TEXT,
          conditions: args[0],
          callback: args[1],
          multi: args[2]
        });
      } else if (method === 'attach') {
        return this;
      } else {
        methods[method].call(this, {
          type: TEXT
        });
      }
    }
  });
  // Use $.onCreate as a shortcut to onCreate at the document level.
  $.onCreate = function (selector, callback, multi) {
    $(document).onCreate(selector, callback, multi);
  };
  //$.onCreate.debug = false;
})($ && $.fn && $.fn.jquery ? $ : jQuery, window.MutationObserver || window.WebKitMutationObserver || window.MozMutationObserver || false, document, window);