var HNModelMaterial = function(id, texture, program) {
    this.id = id;
    this.texture = texture;
    this.program = program;
    if (this.texture) {
        this.texture.refCount++;
    }
    if (this.program) {
        this.program.refCount++;
    }
    this.refCount = 0;
}
HNModelMaterial.prototype.dispose = function() {
    if (this.texture) {
        this.texture.refCount--;
        this.texture = null;
    }
    if (this.program) {
        this.program.refCount--;
        this.program = null;
    }
}
