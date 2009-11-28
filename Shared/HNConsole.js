var HNConsole = function() { };
HNConsole.prototype.debug = function(message) { }
HNConsole.prototype.info = function(message) { }
HNConsole.prototype.warn = function(message) { }
HNConsole.prototype.error = function(message) { }
HNConsole.prototype.assert = function(expression, message) { }
HNConsole.prototype.beginGroup = function(message) { }
HNConsole.prototype.beginGroupCollapsed = function(message) { }
HNConsole.prototype.endGroup = function() { }
HNConsole.prototype.beginTimer = function(name) { }
HNConsole.prototype.endTimer = function(name) { }
HNConsole.prototype.counter = function(title) { }

if (window.console) {
    if (jQuery.browser.safari) {
        // WebKit inspector - note that it doesn't like assigning console functions to our functions
        HNConsole.prototype.debug = function() { console.debug.apply(console, arguments); };
        HNConsole.prototype.info = function() { console.info.apply(console, arguments); };
        HNConsole.prototype.warn = function() { console.warn.apply(console, arguments); };
        HNConsole.prototype.error = function() { console.error.apply(console, arguments); };
        HNConsole.prototype.assert = function() { console.assert.apply(console, arguments); };
        HNConsole.prototype.beginGroup = function() { console.group.apply(console, arguments); };
        if (console.groupCollapsed) {
            HNConsole.prototype.beginGroupCollapsed = function() { console.groupCollapsed.apply(console, arguments); };
        } else {
        HNConsole.prototype.beginGroupCollapsed = function() { console.group.apply(console, arguments); };
        }
        HNConsole.prototype.endGroup = function() { console.groupEnd.apply(console, arguments); };
        HNConsole.prototype.beginTimer = function() { console.time.apply(console, arguments); };
        HNConsole.prototype.endTimer = function() { console.timeEnd.apply(console, arguments); };
        HNConsole.prototype.counter = function() { console.count.apply(console, arguments); };
    } else {
        // Firebug (with console enabled)
        HNConsole.prototype.debug = console.debug;
        HNConsole.prototype.info = console.info;
        HNConsole.prototype.warn = console.warn;
        HNConsole.prototype.error = console.error;
        HNConsole.prototype.assert = console.assert;
        HNConsole.prototype.beginGroup = console.group;
        HNConsole.prototype.beginGroupCollapsed = console.groupCollapsed;
        HNConsole.prototype.endGroup = console.groupEnd;
        HNConsole.prototype.beginTimer = console.time;
        HNConsole.prototype.endTimer = console.timeEnd;
        HNConsole.prototype.counter = console.count;
    }
} else {
    // TODO: support other logging environments
}

var con = new HNConsole();
