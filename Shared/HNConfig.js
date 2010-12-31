var HNConfig = function (defaults) {
    this.defaults = defaults;
    this.makeDefaults();
}
HNConfig.prototype.makeDefaults = function () {
    // TODO: set self to defaults
}
HNConfig.prototype.load = function (configJson) {
    // TODO: set defaults and then overwrite with given json
}
HNConfig.prototype.save = function () {
    // TODO: serialize self to json
}

var config = new HNConfig();
