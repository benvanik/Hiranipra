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

Math.clamp = function(x, min, max) {
    return Math.min(max, Math.max(min, x));
}

function arraySwap(array, i1, i2) {
    var t = array[i1];
    array[i1] = array[i2];
    array[i2] = t;
}
