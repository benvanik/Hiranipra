function typeOf(value) {
    if ($.isArray(value)) {
        return 'array';
    } else if ($.isFunction(value)) {
        return 'function';
    } else if (value === null) {
        return 'null';
    } else {
        return typeof value;
    }
}

Math.clamp = function (x, min, max) {
    return Math.min(max, Math.max(min, x));
}

Array.prototype.swap = function (i1, i2) {
    var t = this[i1];
    this[i1] = this[i2];
    this[i2] = t;
}

Array.swap = function (ar, i1, i2) {
    var t = ar[i1];
    ar[i1] = ar[i2];
    ar[i2] = t;
}

Array.prototype.remove = function (from, to) {
    var rest = this.slice((to || from) + 1 || this.length);
    this.length = from < 0 ? this.length + from : from;
    return this.push.apply(this, rest);
};
