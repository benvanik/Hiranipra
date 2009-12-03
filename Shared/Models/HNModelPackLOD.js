var HNModelPackLODBlock = function(gl, json) {
    this.gl = gl;
    this.format = json.format;
    this.vertices = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, this.vertices);
    gl.bufferData(gl.ARRAY_BUFFER, new WebGLFloatArray(json.vertices), gl.STATIC_DRAW);
    gl.bindBuffer(gl.ARRAY_BUFFER, null);
    this.indices = gl.createBuffer();
    gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, this.indices);
    gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, new WebGLUnsignedShortArray(json.indices), gl.STATIC_DRAW);
    gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, null);
}
HNModelPackLODBlock.prototype.dispose = function() {
    var gl = this.gl;
    gl.deleteBuffer(this.vertices);
    gl.deleteBuffer(this.indices);
    this.gl = null;
}

var HNModelPackLOD = function(gl, modelPack, lodIndex) {
    this.gl = gl;
    this.modelPack = modelPack;
    this.lodIndex = lodIndex;
    this.blocks = [];
}
HNModelPackLOD.prototype.dispose = function() {
    for (var n = 0; n < this.blocks.length; n++) {
        var block = this.blocks[n];
        block.dispose();
    }
    this.blocks = [];
    this.gl = null;
}
HNModelPackLOD.prototype.fillBlock = function(blockIndex, json) {
    var block = new HNModelPackLODBlock(this.gl, json);
    this.blocks[blockIndex] = block;

    // Set block references for all models on this LOD/block
    for (var n = 0; n < json.models.length; n++) {
        var jmodel = json.models[n];
        var model = this.modelPack.models[jmodel.id];
        con.assert(model != null, "model " + jmodel.id + " not found in modelpack");
        var lodRef = model.lods[this.lodIndex];
        lodRef.block = block;
        lodRef.primitiveType = jmodel.type;
        lodRef.indexOffset = jmodel.offset;
        lodRef.indexCount = jmodel.count;
    }
}
