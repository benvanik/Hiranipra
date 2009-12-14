// TODO: use the index buffer - for some reason, it doesn't work as an element buffer, just as a raw array

var HNGLGeometry = function(gl, primitiveType, primitiveCount) {
    this.gl = gl;
    this.primitiveType = primitiveType;
    this.primitiveCount = primitiveCount;
    this.dataBuffers = [];
    this.indexBuffer = null;
}
HNGLGeometry.prototype.dispose = function() {
    var gl = this.gl;
    for (var dataBuffer in this.dataBuffers) {
        gl.deleteBuffer(dataBuffer.handle);
    }
    this.dataBuffers = [];
    if (this.indexBuffer) {
        gl.deleteBuffer(this.indexBuffer);
        this.indexBuffer = null;
    }
    this.gl = null;
}
HNGLGeometry.prototype.setData = function(index, type, count, data) {
    var gl = this.gl;
    if (this.dataBuffers[index]) {
        gl.deleteBuffer(this.dataBuffers[index].handle);
        this.dataBuffers[index] = null;
    }
    if (!data) {
        return;
    }
    var dataArray = null;
    if (typeOf(data) == "array") {
        switch (type) {
            case gl.BYTE:
                dataArray = new WebGLByteArray(data);
                break;
            case gl.UNSIGNED_BYTE:
                dataArray = new WebGLUnsignedByteArray(data);
                break;
            case gl.SHORT:
                dataArray = new WebGLShortArray(data);
                break;
            case gl.UNSIGNED_SHORT:
                dataArray = new WebGLUnsignedShortArray(data);
                break;
            case gl.INTEGER:
                dataArray = new WebGLIntArray(data);
                break;
            case gl.UNSIGNED_INT:
                dataArray = new WebGLUnsignedIntArray(data);
                break;
            case gl.FLOAT:
                dataArray = new WebGLFloatArray(data);
                break;
        }
    } else {
        dataArray = data;
    }
    if (!dataArray) {
        return;
    }

    var buffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
    gl.bufferData(gl.ARRAY_BUFFER, dataArray, gl.STATIC_DRAW);
    gl.bindBuffer(gl.ARRAY_BUFFER, null);
    this.dataBuffers[index] = {
        handle: buffer,
        type: type,
        count: count
    };
}
HNGLGeometry.prototype.setIndices = function(indices) {
    var gl = this.gl;
    if (this.indexBuffer) {
        gl.deleteBuffer(this.indexBuffer);
        this.indexBuffer = null;
    }
    if (!indices) {
        return;
    }
    this.indexBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, this.indexBuffer);
    if (indices.shift) {
        gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, new WebGLUnsignedShortArray(indices), gl.STATIC_DRAW);
    } else {
        gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, indices, gl.STATIC_DRAW);
    }
    gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, null);
}
HNGLGeometry.prototype.draw = function(attribLocations) {
    var gl = this.gl;
    for (var n = 0; n < attribLocations.length; n++) {
        var buffer = this.dataBuffers[n];
        gl.bindBuffer(gl.ARRAY_BUFFER, buffer.handle);
        gl.vertexAttribPointer(attribLocations[n], buffer.count, buffer.type, false, 0, 0);
    }
    if (this.indexBuffer) {
        gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, this.indexBuffer);
        gl.drawElements(this.primitiveType, this.primitiveCount * 3, gl.UNSIGNED_SHORT, 0);
        gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, null);
    } else {
        gl.drawArrays(this.primitiveType, 0, this.primitiveCount);
    }
    gl.bindBuffer(gl.ARRAY_BUFFER, null);
}
HNGLGeometry.prototype.drawRegion = function(attribLocations, primitiveType, indexOffset, indexCount) {
    var gl = this.gl;
    for (var n = 0; n < attribLocations.length; n++) {
        var buffer = this.dataBuffers[n];
        gl.bindBuffer(gl.ARRAY_BUFFER, buffer.handle);
        gl.vertexAttribPointer(attribLocations[n], buffer.count, buffer.type, false, 0, 0);
    }
    gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, this.indexBuffer);
    gl.drawElements(primitiveType, indexCount, gl.UNSIGNED_SHORT, indexOffset);
    gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, null);
    gl.bindBuffer(gl.ARRAY_BUFFER, null);
}

HNGLGeometry.quad = function(gl) {
    var geo = new HNGLGeometry(gl, gl.TRIANGLES, 2);
    geo.setData(0, gl.FLOAT, 3, [
        -0.5, 0, -0.5,
        0.5, 0, -0.5,
        -0.5, 0, 0.5,
        0.5, 0, 0.5
    ]);
    geo.setData(1, gl.FLOAT, 2, [
        0, 0,
        1, 0,
        0, 1,
        1, 1
    ]);
    geo.setIndices([0, 1, 2, 2, 1, 3]);
    return geo;
}

HNGLGeometry.segmentedQuad = function(gl, segments) {
    var positions = new WebGLFloatArray(segments * segments * 4 * 3);
    var texCoords = new WebGLFloatArray(segments * segments * 4 * 2);
    var indices = new WebGLUnsignedShortArray(segments * segments * 6);
    for (var y = 0; y < segments; y++) {
        for (var x = 0; x < segments; x++) {
            var posIndex = (y * segments + x) * 4 * 3;
            positions[posIndex + 0 + 0] = x / segments - 0.5;
            positions[posIndex + 0 + 1] = 0;
            positions[posIndex + 0 + 2] = y / segments - 0.5;
            positions[posIndex + 3 + 0] = x / segments + 1 / segments - 0.5;
            positions[posIndex + 3 + 1] = 0;
            positions[posIndex + 3 + 2] = y / segments - 0.5;
            positions[posIndex + 6 + 0] = x / segments - 0.5;
            positions[posIndex + 6 + 1] = 0;
            positions[posIndex + 6 + 2] = y / segments + 1 / segments - 0.5;
            positions[posIndex + 9 + 0] = x / segments + 1 / segments - 0.5;
            positions[posIndex + 9 + 1] = 0;
            positions[posIndex + 9 + 2] = y / segments + 1 / segments - 0.5;
            var texIndex = (y * segments + x) * 4 * 2;
            texCoords[texIndex + 0 + 0] = x / segments;
            texCoords[texIndex + 0 + 1] = y / segments;
            texCoords[texIndex + 2 + 0] = x / segments + 1 / segments;
            texCoords[texIndex + 2 + 1] = y / segments;
            texCoords[texIndex + 4 + 0] = x / segments;
            texCoords[texIndex + 4 + 1] = y / segments + 1 / segments;
            texCoords[texIndex + 6 + 0] = x / segments + 1 / segments;
            texCoords[texIndex + 6 + 1] = y / segments + 1 / segments;
            var verticesIndex = (y * segments + x) * 4;
            var indicesIndex = (y * segments + x) * 6;
            indices[indicesIndex + 0] = verticesIndex + 0;
            indices[indicesIndex + 1] = verticesIndex + 1;
            indices[indicesIndex + 2] = verticesIndex + 2;
            indices[indicesIndex + 3] = verticesIndex + 2;
            indices[indicesIndex + 4] = verticesIndex + 1;
            indices[indicesIndex + 5] = verticesIndex + 3;
        }
    }
    var geo = new HNGLGeometry(gl, gl.TRIANGLES, segments * segments * 2);
    geo.setData(0, gl.FLOAT, 3, positions);
    geo.setData(1, gl.FLOAT, 2, texCoords);
    geo.setIndices(indices);
    return geo;
}

// From the Apple utils3d.js file released with their demos:
// http://trac.webkit.org/browser/trunk/WebKitSite/blog-files/webgl/resources/utils3d.js?format=txt
HNGLGeometry.sphere = function(gl, radius, lats, longs) {
    var positions = new WebGLFloatArray((lats + 1) * (longs + 1) * 3 * 2);
    var texCoords = new WebGLFloatArray((lats + 1) * (longs + 1) * 2 * 2);
    var normals = new WebGLFloatArray((lats + 1) * (longs + 1) * 3 * 2);
    var indexCount = lats * longs * 6 * 2;
    var indices = new WebGLUnsignedShortArray(indexCount);

    var positionIndex = 0;
    var texCoordIndex = 0;
    var normalIndex = 0;
    for (var latNumber = 0; latNumber <= lats; ++latNumber) {
        for (var longNumber = 0; longNumber <= longs; ++longNumber) {
            var theta = latNumber * Math.PI / lats;
            var phi = longNumber * 2 * Math.PI / longs;
            var sinTheta = Math.sin(theta);
            var sinPhi = Math.sin(phi);
            var cosTheta = Math.cos(theta);
            var cosPhi = Math.cos(phi);

            var x = cosPhi * sinTheta;
            var y = cosTheta;
            var z = sinPhi * sinTheta;
            var u = 1 - (longNumber / longs);
            var v = latNumber / lats;

            positions[positionIndex++] = radius * x;
            positions[positionIndex++] = radius * y;
            positions[positionIndex++] = radius * z;
            texCoords[texCoordIndex++] = u;
            texCoords[texCoordIndex++] = v;
            normals[normalIndex++] = x;
            normals[normalIndex++] = y;
            normals[normalIndex++] = z;
        }
    }

    longs += 1;
    var indicesIndex = 0;
    for (var latNumber = 0; latNumber < lats; ++latNumber) {
        for (var longNumber = 0; longNumber < longs; ++longNumber) {
            var first = (latNumber * longs) + (longNumber % longs);
            var second = first + longs;
            indices[indicesIndex++] = first;
            indices[indicesIndex++] = second;
            indices[indicesIndex++] = first + 1;
            indices[indicesIndex++] = second;
            indices[indicesIndex++] = second + 1;
            indices[indicesIndex++] = first + 1;
        }
    }

    var geo = new HNGLGeometry(gl, gl.TRIANGLES, indexCount / 3);
    geo.setData(0, gl.FLOAT, 3, positions);
    geo.setData(1, gl.FLOAT, 2, texCoords);
    //geo.setData(2, gl.FLOAT, 3, normal);
    geo.setIndices(indices);
    return geo;
}
