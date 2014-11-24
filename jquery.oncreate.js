/*!
 * jQuery onCreate plugin v1.1
 * http://jquery.com/
 *
 * Copyright 2014 CROmetrics
 * Released under the MIT license
 * https://github.com/eclecto/jQuery-onCreate/blob/master/LICENSE
 *
 * Date: 2014-11-24T09:46Z
 */

/* jshint expr: true */
/* global jQuery, console, window, document, $, setInterval, clearInterval */

(function ($, MutationObserver, document, window) {
    // Check for the existence of jQuery.
    if(!$.fn.jquery) {
        window.console = window.console || { log: function(){}, warn: function(){} };
        window.console.warn('jQuery is undefined. onCreate can not initialize.');
        return;
    }
    
    function Observer(mutcallback) {
        var realObserver;
        
        if (MutationObserver) {
            realObserver = new MutationObserver(mutcallback);
        }
        
        this.observe = function(parent) {
            if (MutationObserver) {
                realObserver.observe(parent, {
                    childList: true,
                    subtree: true
                });
            } else {
                realObserver = setInterval(mutcallback, 50);
            }
        };
        
        this.disconnect = function() {
            if(realObserver) {
                if (MutationObserver) {
                    realObserver.disconnect();
                } else {
                    clearInterval(realObserver);
                }
            }
        };
    }
    
    function debug() {
        if($.onCreate.debug) {
            var warn = Function.prototype.bind.call(console.warn, console);
            warn.apply(console, arguments);
        }
    }
    
    var methods = {
        attach: function(selector, callback, multi) {
            // Get/initiate this element's callback data and the array of callbacks for the current selector.
            this.data('onCreate') || this.data('onCreate', {});
            var oc = this.data('onCreate');
            oc[selector] = oc[selector] || {
                callbacks: []
            };

            var current = oc[selector],
                cblist = current.callbacks;

            // Add the callback to the array of callbacks for the current selector.
            cblist.unshift({
                callback: callback,
                multi: multi,
                // Create a universally unique identifier for the current parent/child relationship.
                uuid: 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function (c) {
                    var r = Math.random() * 16 | 0,
                        v = c == 'x' ? r : (r & 0x3 | 0x8);
                    return v.toString(16);
                })
            });

            if (current.observer === undefined) {
                // Store `this` to a variable to use as a context
                var $this = this,
                    observer, i,
                    // This method filters out elements that have already been processed by the current callback.
                    filter = function (index, element) {
                        if ($(element).attr('data-oc-processed-' + cblist[i].uuid)) {
                            return false;
                        } else {
                            return true;
                        }
                    },

                    // Define our callback for when a mutation is detected.
                    mutcallback = function () {
                        // Find elements that have not already been processed by this observer.
                        var selected = $(selector, $this);

                        if (selected.length > 0) {
                            for (i = cblist.length - 1; i >= 0; i--) {
                                var elements = selected.filter(filter);
                                if (elements.length > 0) {
                                    elements.attr('data-oc-processed-' + cblist[i].uuid, true);
                                    cblist[i].callback.apply($this, [elements]);
                                }
                                // Remove callback from the list if it only runs once.
                                if (!cblist[i].multi) {
                                    cblist.splice(i, 1);
                                }
                            }
                            if (cblist.length === 0) {
                                if (observer) {
                                    observer.disconnect();
                                } else {
                                    return true;
                                }
                            }
                        }
                    };
                // Sanity Check: run the callback on initialization to see if there is already a valid element.
                if (mutcallback()) {
                    return this;
                }                
                
                observer = current.observer = new Observer(mutcallback);
                observer.observe($this[0]);
            }
            return this;
        },
        detach: function(selector, callback) {
            var oc = this.data('onCreate'),
                sel, i;
            if(typeof(selector) === 'undefined') {
                // Detach everything.
                for(i in oc) {
                    sel = oc[i];
                    if(sel.observer) sel.observer.disconnect();
                }
                // Remove all the onCreate data but leave the original object intact so any future attachments will go faster.
                delete oc[i];
            } else if(typeof(selector) === 'string') {
                if(oc[selector]) {                
                    sel = oc[selector];
                    if(typeof(callback) === 'undefined') {    
                        sel.observer.disconnect();
                        delete oc[selector];
                    } else if (typeof(callback) === 'function') {
                        var cblist = sel.callbacks;
                        for(i = cblist.length - 1; i >= 0; i--) {
                            if(cblist[i].callback === callback) {
                                cblist.splice(i, 1);
                                break;
                            }
                        }
                        if (cblist.length === 0) {
                            if (sel.observer) {
                                sel.observer.disconnect();
                            } else {
                                return true;
                            }
                        }
                    } else {
                        debug('OnCreate: Invalid callback passed.');
                    }
                } else {
                    debug('OnCreate: No callbacks exist for the current selector.');
                }
            } else {
                debug('OnCreate: Invalid argument passed for "selector."');
            }
            return this;
        }
    };
    
    // onCreate method
    $.fn.extend({
        onCreate: function () {            
            // Do nothing if we recieve an empty object.
            if(this.length === 0) {
                debug("OnCreate: No valid parent elements.");
                return this;
            }
            
            var args = Array.prototype.slice.call(arguments);
            
            if(typeof(args[0]) !== 'string') {
                debug("OnCreate: Invalid argument. You must pass a string representing either an onCreate method or a jQuery selector.");
                return this;
            }
            
            if(methods[args[0]]) {
                return methods[args[0]].apply(this, args.slice(1));
            } else
            // Default init functionality.
            if(typeof(args[0]) === 'string' && typeof(args[1]) === 'function') {
                var selector = args[0], callback = args[1], multi = args[2] ? args[2] : false;
                return methods.attach.apply(this, args);
            } else {
                console.log(args[0] + " is not a valid onCreate method or no callback was given.");
                return this;
            }
        }
    });
    // Use $.onCreate as a shortcut to onCreate at the document level.
    $.onCreate = function (selector, callback, multi) {
        $(document).onCreate(selector, callback, multi);
    };
    $.onCreate.debug = false;
})(jQuery || $, window.MutationObserver || window.WebKitMutationObserver || window.MozMutationObserver || false, document, window);