/*!
 * jQuery onCreate plugin v1.2-dev
 * http://jquery.com/
 *
 * Copyright 2014 CROmetrics
 * Released under the MIT license
 * https://github.com/eclecto/jQuery-onCreate/blob/master/LICENSE
 *
 * Date: 2014-12-17T16:10Z
 */

/* jshint expr: true */
/* global jQuery, console, window, document, $, setInterval, clearInterval */

(function ($, MutationObserver, document, window) {
    // MutationObserver = false; // Test C/B fallbacks.
    // Check for the existence of jQuery.
    if (!$.fn.jquery) {
        window.console = window.console || {
            log: function () {},
            warn: function () {}
        };
        window.console.warn('jQuery is undefined. onCreate can not initialize.');
        return;
    }

    // Constants.
    var CREATE = 'create',
        MODIFY = 'modify';

    // Observer class.
    function Observer(mutcallback, type) {
        var realObserver;

        this.observe = function (element) {
            if (MutationObserver) {
                realObserver = realObserver || new MutationObserver(mutcallback);
                var init = (type === MODIFY ? {
                    attributes: true
                } : {
                    childList: true,
                    subtree: true
                });
                realObserver.observe(element, init);
            } else {
                realObserver = setInterval(mutcallback, 50);
            }
        };

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

    function debug() {
        if ($.onCreate.debug) {
            var warn = Function.prototype.bind.call(console.warn, console);
            warn.apply(console, arguments);
        }
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

    var methods = {
        attach: function (options) {
            var type = options.type,
                callback = options.callback,
                multi = options.multi || false,
                selector = options.selector,
                watchedattrs = options.attrs ? options.attrs.split(' ') : null,
                match = options.match,
                mapCompare;
            // Get/initiate this element's callback data and the array of callbacks for the current selector.
            this.data('on' + type) || this.data('on' + type, {});
            var oc = this.data('on' + type);
            if (selector) {
                oc[selector] = oc[selector] || {
                    callbacks: []
                };
            } else {
                oc.callbacks = oc.callbacks || [];
                oc.ignore = false;
            }

            var current = selector ? oc[selector] : oc,
                cblist = current.callbacks,

                // Add the callback to the array of callbacks for the current selector.
                newcb = {
                    callback: callback,
                    multi: multi,
                    // Create a universally unique identifier for the current parent/child relationship.
                    uuid: 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function (c) {
                        var r = Math.random() * 16 | 0,
                            v = c == 'x' ? r : (r & 0x3 | 0x8);
                        return v.toString(16);
                    })
                };
            if (watchedattrs) newcb.attrs = watchedattrs;
            if (match) newcb.match = match;
            cblist.unshift(newcb);
            
            // Create an attribute map for non-MutationObserver browsers so we can track changes.
            if (type === MODIFY /*&& !MutationObserver*/ ) {
                oc.attributeMap = attributeMap(this[0]);

                mapCompare = function (map1, map2) {
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
                };
            }

            if (current.observer === undefined) {
                // Store `this` to a variable to use as a context
                var $this = this,
                    observer, i, attrmatch,
                    // This method filters out elements that have already been processed by the current callback.
                    filter = function (index, element) {
                        if ($(element).attr('data-oc-processed-' + cblist[i].uuid)) {
                            return false;
                        } else {
                            return true;
                        }
                    },
                    checkattrs = function (index, mutation) {
                        var attrname = mutation.attributeName,
                            attrval = $this.attr(attrname),
                            curMatch = cblist[i].match;
                        if (!cblist[i].attrs || cblist[i].attrs.indexOf(attrname) > -1) {
                            if (typeof (curMatch) !== 'undefined') {                                
                                if (attrval.search(curMatch) >= 0) {
                                    attrmatch = true;
                                    return false;
                                }
                            } else {
                                attrmatch = true;
                                return false;
                            }
                        }
                    },

                    // Define our callback for when a mutation is detected.
                    mutcallback = function (mutations) {
                        // For modify listeners we set an Ignore property, so if callbacks also modify attributes we don't risk creating an infinite loop.
                        if (type === MODIFY) {
                            if (!oc.ignore) {
                                oc.ignore = true;
                            } else {
                                return;
                            }
                        }

                        // Find elements that have not already been processed by this observer.
                        var selected = type === CREATE ? $(selector, $this) : $this;

                        if (selected.length > 0) {
                            for (i = cblist.length - 1; i >= 0; i--) {
                                var elements = type === CREATE ? selected.filter(filter) : selected;

                                // Validate changed attributes for modify observers.
                                if (type === MODIFY) {
                                    attrmatch = false;
                                    if (!MutationObserver) {
                                        var newmap = attributeMap($this[0]);
                                        mutations = mapCompare(newmap, oc.attributeMap);
                                    }
                                    $.each(mutations, checkattrs);
                                }

                                if (elements.length > 0 && (type === CREATE || attrmatch)) {
                                    if (type === CREATE || multi === false) elements.attr('data-oc-processed-' + cblist[i].uuid, true);
                                    cblist[i].callback.call($this, elements);
                                    // Remove callback from the list if it only runs once.
                                    if (!cblist[i].multi) {
                                        cblist.splice(i, 1);
                                    }
                                }
                            }
                        }

                        // We've safely iterated through the callbacks, so don't ignore this master callback anymore.
                        if (oc.ignore) oc.ignore = false;
                        if (cblist.length === 0) {
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

                observer = current.observer = new Observer(mutcallback, type);
                observer.observe($this[0]);
            }
            return this;
        },
        detach: function (options) {
            var current, i,
                type = options.type,
                oc = this.data('on' + type),
                callback = options.callback,
                selector = options.selector,
                watchedattrs = options.attrs ? options.attrs.split(' ') : null;
            if ((type === CREATE && typeof (selector) === 'undefined') || (type === MODIFY && typeof (callback) === 'undefined')) {
                // Detach everything.
                if (type === CREATE) {
                    for (i in oc) {
                        current = oc[i];
                        if (current.observer) current.observer.disconnect();
                        delete oc[i];
                    }
                } else if (oc.observer) oc.observer.disconnect();
                // Remove all the onCreate data but leave the original object intact so any future attachments will go faster.
            } else {
                if (type === MODIFY || typeof (selector) === 'string' && oc[selector]) {
                    current = (type === MODIFY ? oc : oc[selector]);
                    if (typeof (callback) === 'undefined') {
                        current.observer.disconnect();
                        delete oc[selector];
                    } else if (typeof (callback) === 'function') {
                        var cblist = current.callbacks;
                        for (i = cblist.length - 1; i >= 0; i--) {
                            if (cblist[i].callback === callback) {
                                cblist.splice(i, 1);
                                break;
                            }
                        }
                        if (cblist.length === 0) {
                            if (current.observer) {
                                current.observer.disconnect();
                            } else {
                                return true;
                            }
                        }
                    } else {
                        debug('OnCreate: Invalid callback.');
                    }
                }
            }
            return this;
        }
    };

    $.fn.extend({
        onCreate: function () {

            if (this.length === 0) {
                debug("OnCreate: No valid parent elements.");
                return this;
            }

            var args = Array.prototype.slice.call(arguments);

            if (typeof (args[0]) !== 'string') {
                debug("OnCreate: Invalid argument. You must pass a string representing either an onCreate method or a jQuery selector.");
                return this;
            }

            if (methods[args[0]]) {
                return methods[args[0]].call(this, {
                    type: CREATE,
                    selector: args[1],
                    callback: args[2],
                    multi: args[3]
                });
            } else
            // Default init functionality.
            if (typeof (args[0]) === 'string' && typeof (args[1]) === 'function') {
                return methods.attach.call(this, {
                    type: CREATE,
                    selector: args[0],
                    callback: args[1],
                    multi: args[2]
                });
            } else {
                console.log(args[0] + " is not a valid onCreate method or no callback was given.");
                return this;
            }
        },

        // onModify. Usage: .onModify([attributes[, match,]], callback, multi)
        onModify: function () {

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
                    type: MODIFY,
                    callback: args[0],
                    multi: args[1]
                });
            } else if (typeof (args[0]) === 'string') {
                if (typeof (args[1]) === 'function') {
                    return methods[method].call(this, {
                        type: MODIFY,
                        attrs: args[0],
                        callback: args[1],
                        multi: args[2]
                    });
                } else if (typeof (args[1]) === 'string' || args[1] instanceof RegExp) {
                    return methods[method].call(this, {
                        type: MODIFY,
                        attrs: args[0],
                        match: args[1],
                        callback: args[2],
                        multi: args[3]
                    });
                }
            } else if (method === 'attach') {
                console.log(args[0] + " is not a valid onCreate method or no callback was given.");
                return this;
            } else {
                methods[method].call(this, {
                    type: MODIFY
                });
            }
        }
    });
    // Use $.onCreate as a shortcut to onCreate at the document level.
    $.onCreate = function (selector, callback, multi) {
        $(document).onCreate(selector, callback, multi);
    };
    $.onCreate.debug = false;
})(jQuery || $, window.MutationObserver || window.WebKitMutationObserver || window.MozMutationObserver || false, document, window);