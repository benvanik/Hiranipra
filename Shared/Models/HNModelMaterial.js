var HNModelMaterial = function(id, texture, effect) {
    this.id = id;
    this.texture = texture;
    this.effect = effect;
    if (this.texture) {
        this.texture.refCount++;
    }
    if (this.effect) {
        this.effect.refCount++;
    }
    this.refCount = 0;
}
HNModelMaterial.prototype.dispose = function() {
    if (this.texture) {
        this.texture.refCount--;
        this.texture = null;
    }
    if (this.effect) {
        this.effect.refCount--;
        this.effect = null;
    }
}
