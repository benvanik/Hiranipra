var HNModelDrawer = function(gl, modelCache, megaTextureCache, feedbackBuffer) {
    this.gl = gl;
    this.modelCache = modelCache;
    this.megaTextureCache = megaTextureCache;
    this.feedbackBuffer = feedbackBuffer;

    // Setup default geometry for loading objects
    this.loadingGeometry = HNGLGeometry.sphere(gl, 1, 8, 8);
    if (!this.loadingGeometry) {
        return;
    }
    this.loadingProgram = HNGLProgram.fromSources(gl,
        [
            "uniform mat4 u_viewProjMatrix;",
            "attribute vec3 a_pos;",
            "attribute vec2 a_tex0;",
            "varying vec2 v_tex0;",
            "void main() {",
            "    gl_Position = u_viewProjMatrix * vec4( a_pos, 1.0 );",
            "    v_tex0 = a_tex0;",
            "}"
        ].join("\n"),
        [
            "varying vec2 v_tex0;",
            "void main() {",
            "    gl_FragColor = vec4( v_tex0.xy, 1.0, 1.0 );",
            "}"
        ].join("\n")
    );
    if (!this.loadingProgram) {
        return;
    }
    this.loadingProgram.begin = function(viewProjMatrix) {
        var gl = this.gl;
        gl.useProgram(this.id);
        gl.uniformMatrix4fv(this.u_viewProjMatrix, false, viewProjMatrix.asArray());
        gl.enableVertexAttribArray(this.a_pos);
        gl.enableVertexAttribArray(this.a_tex0);
    };
    this.loadingProgram.end = function() {
        var gl = this.gl;
        gl.disableVertexAttribArray(this.a_tex0);
        gl.disableVertexAttribArray(this.a_pos);
        //gl.useProgram(null);
    };
}

HNModelDrawer.prototype.drawList = function(viewProjStack, modelStack, list, pass) {
    var gl = this.gl;
    for (var n = 0; n < list.length; n++) {
        var instance = list[n];

        modelStack.push();
        modelStack.multiplyBy(instance.modelMatrix);
        var modelViewProjMatrix = modelStack.current.multiply(viewProjStack.current);

        var desiredLOD = 1;
        var drawLodRef = null;

        if (pass == 1) {
            // Calculate distance from camera/size/etc for LOD
            // TODO: model LOD
            desiredLOD = 1;

            // Find an LOD to draw (request if needed)
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

            instance.lastDesiredLOD = desiredLOD;
            instance.lastDrawLodRef = drawLodRef;
        } else {
            // Pull out the last used parameters
            desiredLOD = instance.lastDesiredLOD;
            drawLodRef = instance.lastDrawLodRef;
        }

        // TODO: add to a batch list of things to draw, sort, then draw them

        if (pass == 1) {
            // Draw only for the sake of megatextures
            if (drawLodRef) {
                var material = instance.model.material;
                material.program.pass1.begin(viewProjStack.current, modelStack.current);
                this.megaTextureCache.setPass1Uniforms(material.program.pass1, this.feedbackBuffer, material.texture);
                // draw
                material.program.pass1.end();
            }
        } else {
            if (drawLodRef) {
                // Have something to draw
                var material = instance.model.material;
                material.program.pass2.begin(viewProjStack.current, modelStack.current);
                this.megaTextureCache.setPass2Uniforms(material.program.pass2, material.texture);
                // draw
                material.program.pass2.end();
                //con.debug("something to draw - lod " + drawLodRef.lod.lodIndex + "." + drawLodRef.blockIndex);
            } else {
                // Nothing to draw - do dummy geometry
                this.loadingProgram.begin(modelViewProjMatrix);
                this.loadingGeometry.draw([this.loadingProgram.a_pos, this.loadingProgram.a_tex0]);
                this.loadingProgram.end();
            }
        }

        modelStack.pop();
    }
}
