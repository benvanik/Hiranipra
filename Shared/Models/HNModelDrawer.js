var HNModelDrawer = function(gl, modelCache) {
    this.gl = gl;
    this.modelCache = modelCache;
}

HNModelDrawer.prototype.drawList = function(viewProjStack, modelStack, list) {
    for (var n = 0; n < list.length; n++) {
        var instance = list[n];
        // ?
    }
}
