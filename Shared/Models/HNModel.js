var HNModel = function(id, lods, anchors, boundingSphere, boundingBox) {
    this.id = id;
    this.lods = lods;
    this.anchors = anchors ? anchors : {};
    this.boundingSphere = boundingSphere;
    this.boundingBox = boundingBox;
    this.refCount = 0;
}
HNModel.prototype.dispose = function() {
}
