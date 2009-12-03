var HNModelCache = function(gl) {
    this.gl = gl;
    this.loader = new HNModelLoader(this);

    this.modelPacks = {};
}
HNModelCache.prototype.dispose = function() {
}

HNModelCache.prototype.requestModelPack = function(modelPackUrl) {
    var modelPack = new HNModelPack(this.gl, modelPackUrl);
    this.modelPacks[modelPackUrl] = modelPack;

    var metadataUrl = modelPackUrl + "/info.json";
    jQuery.getJSON(metadataUrl, function(data, textStatus) {
        if (textStatus == "success") {
            modelPack.fill(data);
        } else {
            con.error("HNMT - unable to load modelpack " + modelPackUrl);
        }
    });

    return modelPack;
}
HNModelCache.prototype.unloadModelPack = function(modelPack) {
    // TODO: unload model pack
    con.debug("unloadModelPack(" + modelPack.url + ") not implemented");
}

HNModelCache.prototype.requestModelPackLOD = function(modelPack, lodIndex, block) {
    var lodUrl = modelPack.url + "/LOD/" + lodIndex + "/" + block + ".json";
    jQuery.getJSON(lodUrl, function(data, textStatus) {
        if (textStatus == "success") {
            modelPack.fillLOD(lodIndex, block, data);
        } else {
            con.error("HNMT - unable to load modelpack LOD " + modelPack.url + "@" + lodIndex + "." + block);
        }
    });
}
HNModelCache.prototype.unloadModelPackLOD = function(modelPack, lodIndex) {
    // TODO: unload model pack LOD
    con.debug("unloadModelPackLOD(" + modelPack.url + ", " + lodIndex + ") not implemented");
}

HNModelCache.prototype.createModelInstance = function(modelUrl) {
    var modelUrlSplit = modelUrl.match(/(.+)\/Model\/(.+)\.(.+)/);
    var modelPackUrl = modelUrlSplit[1];
    var modelId = modelUrlSplit[2];
    var materialId = modelUrlSplit[3];

    var modelPack = this.modelPacks[modelPackUrl];
    if (!modelPack) {
        // Model pack not yet loaded
        var modelPack = this.requestModelPack(modelPackUrl);
        if (!modelPack) {
            throw "unable to request model pack " + modelPackUrl;
        }
        var modelInstance = new HNModelInstance(modelUrl);
        // Register for async fill
        modelPack.addBackfillInstance(modelInstance, modelId, materialId);
        return modelInstance;
    } else if (modelPack.pendingFill == true) {
        var modelInstance = new HNModelInstance(modelUrl);
        // Register for async fill
        modelPack.addBackfillInstance(modelInstance, modelId, materialId);
        return modelInstance;
    } else {
        var model = modelPack.models[modelId];
        if (!model) {
            throw "model " + modelId + " not found at " + modelUrl;
        }
        var material = modelPack.materials[materialId];
        if (!material) {
            throw "material " + materialId + " not found at " + modelUrl;
        }
        var modelInstance = new HNModelInstance(modelUrl, model, material);
        // ?
        return modelInstance;
    }
}
