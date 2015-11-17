jQuery-onMutate
===============

This plugin is a wrapper for the MutationObserver class, with a fallback to setInterval, so you can execute code when elements matching a given selector are created. It includes three methods: .onCreate(), .onModify(), and .onText() (note that onMutate is not a method)

This plugin is dependent on jQuery (tested on version 1.6.4)

**onCreate:**

.onCreate() attaches a listener to an existing parent element, and executes a callback when a new child element matching a given selector is created. If a matching element already exists, the callback will execute immediately.

`jQuery(parent).onCreate(selector, callback[, multi = false]);`

`parent` is a single parent element that is a known ancestor of the created element(s). In case of multiple elements, only the first will be used.

`selector` is a valid jQuery selector for the new element(s) using the parent element as a context. That is, onCreate will poll for a valid new element using `jQuery(selector, parent)`

`callback` is a function to execute when a new matching element is created. It receives one argument, `elements`, which is a jQuery object containing the new elements.

`multi` determines whether the observer will continue to poll for new elements after a match is found. If false, the observer will shut itself off after the first match; otherwise, it will continue to poll, but will only operate on each created element once.

**onModify:**

.onModify() attaches a listener to a single element, and executes a callback whenever one of its attributes is changed with optional conditions.

`jQuery(element).onModify([attributes[, match,]] callback[, multi = false]);`

`element` is the element to be observed.

`attributes` is a space-separated list of attributes to watch. If omitted, the callback will execute on any attribute change.

`match` is an optional string or RegEx that will be matched against the value of any modified attribute(s). If you set a match then you must also specify the `attributes` to watch.

`callback` is the function to execute when a qualifying change is made to the element's attributes. It receives one argument, `element`, which is a jQuery object containing the affected element.

`multi` determines whether the observer will continue to poll for changes after the callback executes. If false, the observer will shut itself off after the first qualifying change; otherwise, it will continue to poll.

**onText:**

.onText() attaches a listener to a single element, and executes a callback whenever its text content changes with optional conditions.

`jQuery(element).onText([match,] callback[, multi = false])`

`element` is the element to be observed.

`match` is an optional string or RegEx that will be matched against element's text content as read with jQuery's .text() method.

`callback` is the function to execute when a qualifying change is made to the element's text content. It receives one argument, `element`, which is a jQuery object containing the affected element.

`multi` determines whether the observer will continue to poll changes after the callback executes. If false, the observer will shut itself off after the first qualifying change; otherwise, it will continue to poll.

**Additional Notes:**

- Just to reiterate, there is currently no actual .onMutate().
- .onCreate() internally creates a MutationObserver that observes with the `childList` and `subtree` options.
- .onModify() internally creates a MutationObserver that observes with the `attributes` option.
- .onText() internally creates a MutationObserver that observes with the `characterData`, `childList`, and `subtree` options. This is so it can recognize text node insertion and deletion as a text change.
- For browsers that do not support MutationObserver, this plugin will check all observed elements at 50ms intervals for changes that match the conditions. Because of this, there can be a slight delay/flash before the callback executes for these browsers.
- .onModify() and .onText() will both momentarily shut themselves off while associated callbacks execute, so if the callback makes further changes to the element's attributes or text it will not create an infinite loop.