jQuery-onCreate
===============

This plugin is a wrapper for the MutationObserver class, with a fallback to setInterval, so you can execute code when elements matching a given selector are created. This plugin is dependent on jQuery (tested on version 1.6.4)

**Basic usage:**

`jQuery(parent).onCreate(selector, callback[, multi = false]);`

`parent` is a single parent element that is a known ancestor of the created element(s).

`selector` is a valid jQuery selector for the new element(s) using the parent element as a context. That is, onCreate will poll for a valid new element using `jQuery(selector, parent)`

`callback` is a function to execute when a new matching element is created. It receives one argument, `elements`, which is a jQuery object containing the new elements.

`multi` determines whether the observer will continue to poll after the first matching descendent element is created. If multi is set to true, the callback will continue to execute on any future matching elements.

Other notes:

- `jQuery.onCreate()` is a shortcut for `jQuery(document).onCreate()`
- All created elements will be flagged so they are only processed by a given callback once. They will not trigger a callback if they have already been processed by it, and they will no longer be passed to a multi-use callback even if new elements are created.
- Do **not** create an element matching a selector in its callback or you will cause an infinite loop. Also beware of creating elements that other onCreate observers might be listening for.
- You may add as many callbacks as you want to a given parent or parent/selector pair.

**Methods**

You may invoke methods on onCreate() using `jQuery().onCreate(methodName[, argument, ...])`

Currently two methods exist: attach and detach.

Attach behaves identically to basic notation and is used internally when a new onCreate callback is created. That is, `jQuery(parent).onCreate('attach', selector, callback)` is equivalent to `jQuery(parent).onCreate(selector, callback)`

Detach allows you to remove onCreate listeners at the parent, selector, or individual callback level.

- `jQuery(parent).onCreate('detach')` detaches all callbacks under all selectors under the given parent and disconnects all associated observers.
- `jQuery(parent).onCreate('detach', selector)` detaches all callbacks associated with the given selector under the given parent and disconnects the associated observer.
- `jQuery(parent).onCreate('detach', selector, callback)` detaches a single callback from the given parent/selector pair. If no other callbacks exist for that pair, the associated observer is disconnected.

**Debugging**

Set `jQuery.onCreate.debug = true` to turn on detailed console messages about any issues with your OnCreate implementation.