;
/*!
 * jQuery onCreate plugin v1.0
 * http://jquery.com/
 *
 * Copyright 2014 CROmetrics
 * Released under the MIT license
 * https://github.com/eclecto/jQuery-onCreate/blob/master/LICENSE
 *
 * Date: 2014-11-10T12:12Z
 */
(function ($, MutationObserver, document, window) {
    // Check for the existence of jQuery.
    if(!$.fn.jquery) {
        window.console = window.console || { log: function(){} };
        window.console.log('jQuery is undefined.');
        return;
    }
    
    // onCreate method
    $.fn.extend({
        onCreate: function (selector, callback, multi) {
            // Multi defaults to false
            if (typeof (multi) == 'undefined') {
                multi = false;
            }

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
                                    if (MutationObserver) {
                                        observer.disconnect();
                                    } else {
                                        clearInterval(observer);
                                    }
                                } else {
                                    return true;
                                }
                            }
                        }
                    };
                    // Idiot test: run the callback on initialization to see if there is already a valid element.
                if (mutcallback()) {
                    return this;
                }

                if (MutationObserver) {
                    observer = current.observer = new MutationObserver(mutcallback);
                    observer.observe($(this)[0], {
                        childList: true,
                        subtree: true
                    });
                } else {
                    observer = current.observer = setInterval(mutcallback, 50);
                }
            }
            return this;
        }
    });
    // Use $.onCreate as a shortcut to onCreate at the document level.
    $.onCreate = function (selector, callback, multi) {
        $(document).onCreate(selector, callback, multi);
    };
})(jQuery || $, window.MutationObserver || window.WebKitMutationObserver || window.MozMutationObserver || false, document, window);