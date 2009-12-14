var HNModelPack = function(gl, url) {
    this.gl = gl;
    this.url = url;

    var defaultvs =
        [
            "uniform mat4 u_viewProjMatrix;",
            "uniform mat4 u_modelMatrix;",
            "attribute vec3 a_pos;",
            "attribute vec3 a_normal;",
            "attribute vec2 a_tex0;",
            "varying vec2 v_tex0;",
            "void main() {",
            "    gl_Position = ( u_viewProjMatrix * u_modelMatrix ) * vec4( a_pos, 1.0 );",
            "    v_tex0 = a_tex0;",
            "}"
        ].join("\n");
    var defaultfs1 =
        [
            "varying vec2 v_tex0;",
            "void main() {",
            "    gl_FragColor = MTCalculateTileKeyRGBA( v_tex0 );",
            "}"
        ].join("\n");
    var defaultfs2 =
        [
            "varying vec2 v_tex0;",
            "void main() {",
            "    //gl_FragColor = MTSampleBilinear( v_tex0 );",
            "    //gl_FragColor = MTSampleTrilinear( v_tex0 );",
            "    gl_FragColor = vec4( 1.0 );",
            "}"
        ].join("\n");
    this.defaultProgram = {
        pass1: HNGLProgram.fromSources(gl,
                            HNMegaTextureShaders.prependPass1vs(defaultvs),
                            HNMegaTextureShaders.prependPass1fs(defaultfs1)
                        ),
        pass2: HNGLProgram.fromSources(gl,
                            HNMegaTextureShaders.prependPass2vs(defaultvs),
                            HNMegaTextureShaders.prependPass2fs(defaultfs2)
                        )
    };
    this.defaultProgram.pass1.begin = this.defaultProgram.pass2.begin = function(viewProjMatrix, modelMatrix) {
        var gl = this.gl;
        gl.useProgram(this.id);
        gl.uniformMatrix4fv(this.u_viewProjMatrix, false, viewProjMatrix.asArray());
        gl.uniformMatrix4fv(this.u_modelMatrix, false, modelMatrix.asArray());
        gl.enableVertexAttribArray(this.a_pos);
        gl.enableVertexAttribArray(this.a_normal);
        gl.enableVertexAttribArray(this.a_tex0);
    };
    this.defaultProgram.pass1.end = this.defaultProgram.pass2.end = function() {
        var gl = this.gl;
        gl.disableVertexAttribArray(this.a_tex0);
        gl.disableVertexAttribArray(this.a_normal);
        gl.disableVertexAttribArray(this.a_pos);
        //gl.useProgram(null);
    };

    this.textures = {};
    this.materials = {};
    this.models = {};
    this.lods = [];

    this.pendingFill = true;
    this.backfillList = [];
}
HNModelPack.prototype.dispose = function() {
    // TODO: dispose models/etc
    for (var n = 0; n < this.lods.length; n++) {
        this.lods[n].dispose();
    }
    this.lods = [];
    this.gl = null;
}

HNModelPack.prototype.addBackfillInstance = function(modelInstance, modelId, materialId) {
    this.backfillList.push({
        modelInstance: modelInstance,
        modelId: modelId,
        materialId: materialId
    });
}
HNModelPack.prototype.processBackfills = function() {
    if (this.backfillList.length == 0) {
        return;
    }
    con.beginGroupCollapsed("HNMP - backfilling " + this.backfillList.length + " instances");
    for (var n = 0; n < this.backfillList.length; n++) {
        var backfillEntry = this.backfillList[n];
        var model = this.models[backfillEntry.modelId];
        if (!model) {
            throw "model " + backfillEntry.modelId + " not found at " + backfillEntry.modelInstance.modelUrl;
        }
        var material = this.materials[backfillEntry.materialId];
        if (!material) {
            throw "material " + backfillEntry.materialId + " not found at " + backfillEntry.modelInstance.modelUrl;
        }
        backfillEntry.modelInstance.fill(model, material);
    }
    this.backfillList = [];
    con.endGroup();
}

HNModelPack.prototype.fill = function(json) {
    con.beginGroupCollapsed("HNMP - filling modelpack " + this.url);

    for (var n = 0; n < json.textures.length; n++) {
        var jtexture = json.textures[n];
        var texture = {};
        this.textures[jtexture.id] = texture;
    }
    for (var n = 0; n < json.materials.length; n++) {
        var jmaterial = json.materials[n];
        var texture = this.textures[jmaterial.texture];
        if (!texture) {
            con.warn("texture not found: " + jmaterial.texture);
        }
        var material = new HNModelMaterial(jmaterial.id, texture, this.defaultProgram); // TODO: effect
        this.materials[jmaterial.id] = material;
    }
    for (var n = 0; n < json.models.length; n++) {
        var jmodel = json.models[n];
        var lods = [];
        for (var m = 0; m < jmodel.lods.length; m++) {
            var lod = this.lods[m];
            if (!lod) {
                // Create LOD if it hasn't been hit yet
                lod = new HNModelPackLOD(this.gl, this, m);
                this.lods[m] = lod;
            }
            lods.push({
                lod: lod,
                blockIndex: jmodel.lods[m],
                block: null // will be filled in later on block fill
            });
        }
        var anchors = {};
        for (var m = 0; m < jmodel.anchors.length; m++) {
            var janchor = jmodel.anchors[m];
            var anchor = new HNModelAnchor(
                janchor.id,
                new HNVector3(janchor.position[0], janchor.position[1], janchor.position[2]),
                janchor.orientation
            );
            anchors[janchor.id] = anchor;
        }
        var boundingSphere = new HNVector4(
            jmodel.boundingSphere.center[0], jmodel.boundingSphere.center[1], jmodel.boundingSphere.center[2], jmodel.boundingSphere.radius
        );
        var boundingBox = [
            new HNVector3(jmodel.boundingBox.min[0], jmodel.boundingBox.min[1], jmodel.boundingBox.min[2]),
            new HNVector3(jmodel.boundingBox.max[0], jmodel.boundingBox.max[1], jmodel.boundingBox.max[2])
        ];
        var model = new HNModel(this, jmodel.id, lods, anchors, boundingSphere, boundingBox);
        this.models[jmodel.id] = model;
    }

    this.processBackfills();
    con.endGroup();
}
HNModelPack.prototype.fillLODBlock = function(lodIndex, blockIndex, json) {
    con.beginGroupCollapsed("HNMP - filling LOD " + this.url + "@" + lodIndex + "." + blockIndex);
    var lod = this.lods[lodIndex];
    con.assert(lod != null, "lod " + lodIndex + " not found");
    lod.fillBlock(blockIndex, json);
    con.endGroup();
}
