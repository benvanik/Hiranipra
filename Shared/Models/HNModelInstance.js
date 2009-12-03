var HNModelInstance = function(modelUrl, model, material) {
    this.modelUrl = modelUrl;
    this.pendingFill = true;
    if (model && material) {
        // Model is loaded
        this.fill(model, material);
    } else {
        // Model not yet loaded - awaiting a fill
    }
}
HNModelInstance.prototype.dispose = function() {
    this.pendingFill = false;
    if (this.model) {
        this.model.refCount--;
        this.model = null;
    }
    if (this.material) {
        this.material.refCount--;
        this.material = null;
    }
}
HNModelInstance.prototype.fill = function(model, material) {
    if (this.pendingFill == false) {
        return;
    }
    this.model = model;
    this.model.refCount++;
    this.material = material;
    this.material.refCount++;
    this.pendingFill = false;
}
