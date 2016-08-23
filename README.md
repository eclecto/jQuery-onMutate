jQuery-onMutate
===============

This plugin is a wrapper for the MutationObserver class, with a fallback to setInterval, so you can execute code when elements matching a given selector are created or have their attributes or text changed. It includes three methods: .onCreate(), .onModify(), .onText(), and .onMutate().

This plugin is dependent on jQuery (tested on version 1.6.4)

Installation
------------

```npm install --save jquery-onmutate```

Usage
-----

```var onMutate = require('jquery-onmutate');
var jQuery = require('jquery');

onMutate(jQuery);```

API
===

.onCreate()
-----------

Attaches a listener to an existing parent element, and executes a callback when a new descendent element matching a given selector is created. If a matching element already exists, the callback will execute immediately.

`parent.onCreate(selector, callback[, multi = false]);`

**parent** (jQuery) a single parent element that is a known ancestor of the created element(s). Only the first element in the set will be used.

**selector** (string) is a valid jQuery selector for the new element(s). OnMutate will poll for a valid new element using `jQuery(selector, parent)`

**callback** (function) the callback executed when a new matching element is created. It receives one argument, **elements**, which is a jQuery object containing the new elements.

**multi** (boolean) determines whether the observer will continue to poll for new elements after a match is found. If false, the observer will shut itself off after the first match(es); this includes if matching elements already exist when onCreate is called. Otherwise, it will continue to poll, but will only operate on each created element once.

`$.onCreate()` will attach the onCreate listener to the document, i.e. is the same as `$(document).onCreate()`.

`parent.onCreate('detach'[, callback]);`

This usage shuts off the onCreate listener completely or, optionally, removes only a single callback. The callback passed must be identical to the function used to instantiate onCreate, best done by storing it as a variable.

.onModify()
-----------

Attaches a listener to a single element, and executes a callback whenever one of its attributes is changed with optional conditions. While the callback executes the listener will be momentarily shut off, to prevent infinite loops if the callback also changes the element's attributes.

`element.onModify([attributes[, match,]] callback[, multi = false]);`

**element** (jQuery) the element to be observed.

**attributes** (string) is a space-separated list of attributes to watch. If omitted, the callback will execute on any attribute change.

**match** (string|RegExp) is a string or RegExp that will be matched against the new value of any modified attribute(s). If you set a match then you must also specify the **attributes** to watch.

**callback** (function) is the function to execute when a qualifying change is made to the element's attributes. It receives one argument, **element**, which is a jQuery object containing the affected element.

**multi** (boolean) determines whether the observer will continue to poll for changes after the callback executes. If false, the observer will shut itself off after the first qualifying change; otherwise, it will continue to poll.

`element.onModify('detach'[, callback]);`

This usage shuts off the onModify listener completely or, optionally, removes only a single callback. The callback passed must be identical to the function used to instantiate onMutate, best done by storing it as a variable.

.onText()
---------

Attaches a listener to a single element, and executes a callback whenever its text content changes with optional conditions. While the callback executes the listener will be momentarily shut off, to prevent infinite loops if the callback also changes the element's text.

`element.onText([match,] callback[, multi = false])`

**element** (jQuery) is the element to be observed.

**match** (string|RegExp) is an optional string or RegExp that will be matched against element's new text content, as read with jQuery's `.text()` method.

**callback** (function) is the function to execute when a qualifying change is made to the element's text content. It receives one argument, `element`, which is a jQuery object containing the affected element.

**multi** (boolean) determines whether the observer will continue to poll changes after the callback executes. If false, the observer will shut itself off after the first qualifying change; otherwise, it will continue to poll.

`element.onText('detach'[, callback]);`

This usage shuts off the onText listener completely or, optionally, removes only a single callback. The callback passed must be identical to the function used to instantiate onText, best done by storing it as a variable.

.onMutate()
-----------

An alternative way to call one of the methods above, passing the type of mutation as an argument.

`element.onMutate(type, ...)`

**element** (jQuery) is the element to be observed.

**type** (string) should be "create", "modify", or "text".

Additional arguments are specific to the method being invoked.

Additional Notes:
-----------------
- .onCreate() internally creates a MutationObserver that observes with the `childList` and `subtree` options.
- .onModify() internally creates a MutationObserver that observes with the `attributes` option.
- .onText() internally creates a MutationObserver that observes with the `characterData`, `childList`, and `subtree` options. This is so it can recognize text node insertion and deletion as a text change, as well as observing characterData changes to existing text nodes.
- For browsers that do not support MutationObserver, this plugin will check all observed elements at 50ms intervals for changes that match the conditions. Because of this, there can be a slight delay/flash before the callback executes for these browsers.