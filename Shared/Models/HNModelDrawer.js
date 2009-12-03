var HNModelDrawer = function(gl, modelCache) {
    this.gl = gl;
    this.modelCache = modelCache;
}

HNModelDrawer.prototype.drawList = function(viewProjStack, modelStack, list) {
    for (var n = 0; n < list.length; n++) {
        var instance = list[n];

        modelStack.push();
        modelStack.multiplyBy(instance.modelMatrix);

        // Calculate distance from camera/size/etc for LOD
        // TODO: model LOD
        var desiredLOD = 1;

        // Find an LOD to draw (request if needed)
        var drawLodRef = null;
        if (instance.pendingFill == false) {
            for (var lodIndex = desiredLOD; lodIndex >= 0; lodIndex--) {
                var lodRef = instance.model.lods[lodIndex];
                if (lodRef.block) {
                    // Block found - use it
                    drawLodRef = lodRef;
                    break;
                } else {
                    // Request block
                    this.modelCache.requestModelPackLODBlock(instance.model.modelPack, lodIndex, lodRef.blockIndex);
                }
            }
        }

        if (drawLodRef) {
            // Have something to draw
            //con.debug("something to draw - lod " + drawLodRef.lod.lodIndex + "." + drawLodRef.blockIndex);
        } else {
            // Nothing to draw - do dummy geometry
            //con.debug("nothing to draw");
        }

        modelStack.pop();
    }
}
