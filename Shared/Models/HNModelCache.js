var HNModelCache = function(gl) {
    this.gl = gl;

    this.modelPacks = {};
    this.pendingBlocks = [];
}
HNModelCache.prototype.dispose = function() {
}

HNModelCache.prototype.requestModelPack = function(modelPackUrl) {
    var modelPack = new HNModelPack(this.gl, modelPackUrl);
    this.modelPacks[modelPackUrl] = modelPack;

    var metadataUrl = modelPackUrl + "/info.json";
    var modelCache = this;
    jQuery.getJSON(metadataUrl, function(data, textStatus) {
        if (textStatus == "success") {
            modelPack.fill(data);

            // Request all LOD 0 blocks
            for (var modelId in modelPack.models) {
                var model = modelPack.models[modelId];
                var lodRef = model.lods[0];
                if (lodRef && !lodRef.block) {
                    modelCache.requestModelPackLODBlock(modelPack, 0, lodRef.blockIndex);
                }
            }
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

HNModelCache.prototype.requestModelPackLODBlock = function(modelPack, lodIndex, blockIndex) {
    var blockUrl = modelPack.url + "/LOD/" + lodIndex + "/" + blockIndex + ".json";
    if (this.pendingBlocks[blockUrl]) {
        // Already downloading
        return;
    }
    this.pendingBlocks[blockUrl] = true;
    
    var modelCache = this;
    jQuery.getJSON(blockUrl, function(data, textStatus) {
        if (textStatus == "success") {
            modelPack.fillLODBlock(lodIndex, blockIndex, data);
            delete modelCache.pendingBlocks[blockUrl];
        } else {
            con.error("HNMT - unable to load modelpack LOD " + modelPack.url + "@" + lodIndex + "." + blockIndex);
        }
    });
}
HNModelCache.prototype.unloadModelPackLODBlock = function(modelPack, lodIndex, blockIndex) {
    // TODO: unload model pack LOD block
    con.debug("unloadModelPackLODBlock(" + modelPack.url + ", " + lodIndex + +", " + blockIndex + ") not implemented");
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
