var HNKeyboard = function() {
    this.pressedKeys = new Object();
    this.takeFocus();
}
// TODO: preserve previous handlers
HNKeyboard.prototype.takeFocus = function() {
    this.clear();
    var keyboard = this;
    document.onkeydown = function(event) {
        var e = event ? event : window.event;
        keyboard.onKeyDown(e);
        if (e.preventDefault) {
            e.preventDefault();
            return false;
        } else {
            return true;
        }
    };
    document.onkeyup = function(event) {
        var e = event ? event : window.event;
        keyboard.onKeyUp(e);
        if (e.preventDefault) {
            e.preventDefault();
            return false;
        } else {
            return true;
        }
    };
}
HNKeyboard.prototype.loseFocus = function() {
    this.clear();
    document.onkeydown = null;
    document.onkeyup = null;
}
HNKeyboard.prototype.onKeyDown = function(e) {
//    if (!this.pressedKeys[e.keyCode]) {
//        con.debug("key down " + e.keyCode);
//    }
    this.pressedKeys[e.keyCode] = true;
}
HNKeyboard.prototype.onKeyUp = function(e) {
//    if (this.pressedKeys[e.keyCode]) {
//        con.debug("key up " + e.keyCode);
//    }
    this.pressedKeys[e.keyCode] = false;
}
HNKeyboard.prototype.clear = function() {
    this.pressedKeys = new Object();
}
HNKeyboard.prototype.isDown = function(keyCode) {
    return this.pressedKeys[keyCode];
}
