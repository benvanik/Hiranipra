var HNMegaTextureTileRef = function(tile) {
    this.megaTexture = tile.megaTexture;
    this.level = tile.level;
    this.tileX = tile.tileX;
    this.tileY = tile.tileY;
    this.parent = null;
    this.children = [null, null, null, null];
}
HNMegaTextureTileRef.prototype.bindToSlot = function(n, width, height) {
    this.n = n;
    this.width = width;
    this.height = height;
}
HNMegaTextureTileRef.prototype.touch = function(frameNumber) {
    this.lastUse = frameNumber;
}

var HNMegaTextureLookup = function(textureCache) {
    this.textureCache = textureCache;
    var gl = this.textureCache.gl;

    // TODO: size lookup properly
    this.maxLevel = 8;
    this.width = Math.pow(2, this.maxLevel) * 2;
    this.height = Math.pow(2, this.maxLevel);
    this.stride = this.width * 3;
    con.info("lookup table " + this.width + "x" + this.height + " (" + (this.width * this.height * 3) + "b) with " + 1 + " slots each up to level " + this.maxLevel);

    this.texture = gl.createTexture();
    gl.bindTexture(gl.TEXTURE_2D, this.texture);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.NEAREST);
    emptyTexImage2D(gl, gl.RGB, this.width, this.height, gl.RGB, gl.UNSIGNED_BYTE);
    gl.bindTexture(gl.TEXTURE_2D, null);

    this.data = new WebGLUnsignedByteArray(this.width * this.height * 3);
}
HNMegaTextureLookup.prototype.dispose = function() {
    var gl = this.textureCache.gl;
    this.data = null;
    gl.deleteTexture(this.texture);
    this.texture = null;
}
HNMegaTextureLookup.prototype.beginUpdate = function() {
    var gl = this.textureCache.gl;
}
HNMegaTextureLookup.prototype.endUpdate = function() {
    var gl = this.textureCache.gl;
    gl.bindTexture(gl.TEXTURE_2D, this.texture);
    gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGB, this.width, this.height, 0, gl.RGB, gl.UNSIGNED_BYTE, this.data);
    gl.bindTexture(gl.TEXTURE_2D, null);
}
HNMegaTextureLookup.prototype.fillTileLevel = function(slot, level, lx, ly, lw, ls, tx, ty) {
    var dataIndex = 0; // TODO: slot offset
    dataIndex += (1 << level) * 3;
    dataIndex += (ly * this.stride) + (lx * 3);
    for (var y = ly; y < ly + lw; y++) {
        var rowIndex = dataIndex;
        for (var x = lx; x < lx + lw; x++, rowIndex += 3) {
            this.data[rowIndex + 0] = tx;
            this.data[rowIndex + 1] = ty;
            this.data[rowIndex + 2] = ls;
        }
        dataIndex += this.stride;
    }
}
HNMegaTextureLookup.prototype.recursiveFillTile = function(slot, tileRef) {
    // Fill self in
    var tx = Math.floor(tileRef.n % this.textureCache.tilesPerSide);
    var ty = Math.floor(tileRef.n / this.textureCache.tilesPerSide);
    this.fillTileLevel(slot, tileRef.level, tileRef.tileX, tileRef.tileY, 1, 1, tx, ty);

    if (tileRef.children[0] || tileRef.children[1] || tileRef.children[2] || tileRef.children[3]) {
        // At least one child exists - slow fill each quadrant (through the pyramid)
        for (var n = 0; n < 4; n++) {
            var childRef = tileRef.children[n];
            if (childRef) {
                // Child is already filled (probably) - skip it
            } else {
                // Fill child with self (and all levels below it)
                for (var level = tileRef.level + 1; level <= tileRef.megaTexture.maxLevel; level++) {
                    var levelDiff = level - tileRef.level;
                    var lw = (1 << levelDiff);
                    var lwh = Math.floor(lw / 2);
                    var lx = (tileRef.tileX << levelDiff);
                    var ly = (tileRef.tileY << levelDiff);
                    switch (n) {
                        case 0: break;
                        case 1: lx += lwh; break;
                        case 2: ly += lwh; break;
                        case 3: lx += lwh; ly += lwh; break;
                    }
                    this.fillTileLevel(slot, level, lx, ly, lwh, lw, tx, ty);
                }
            }
        }
    } else {
        // Leaf node in the quad tree - fill all children in (and all levels below us)
        for (var level = tileRef.level + 1; level <= tileRef.megaTexture.maxLevel; level++) {
            var levelDiff = level - tileRef.level;
            var lx = tileRef.tileX << levelDiff;
            var ly = tileRef.tileY << levelDiff;
            var lw = 1 << levelDiff;
            this.fillTileLevel(slot, level, lx, ly, lw, lw, tx, ty);
        }
    }
}
HNMegaTextureLookup.prototype.processChanges = function(changedTiles) {
    // TODO: ensure we aren't adding AND removing a tile in the same frame (not possible?)
    for (var n = 0; n < changedTiles.length; n++) {
        //changedTiles[n].op == "add" "remove"
        if (changedTiles[n].tileRef) {
            // Refresh
            var tileRef = changedTiles[n].tileRef;
            var slot = 0; // TODO: slots
            this.recursiveFillTile(slot, tileRef);
        } else {
            var slot = changedTiles[n].slot;
            // Clear the entire slot
            // Note that there is probably a better way
            this.data = new WebGLUnsignedByteArray(this.width * this.height * 3);
        }
    }
}
