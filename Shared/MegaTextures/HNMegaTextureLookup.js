var HNMegaTextureTileRef = function(tile) {
    this.megaTexture = tile.megaTexture;
    this.level = tile.level;
    this.tileX = tile.tileX;
    this.tileY = tile.tileY;
    this.parent = null;
    this.children = [null, null, null, null];
    this.key = [this.megaTexture.uniqueId, this.level, this.tileX, this.tileY].join(",");
}
HNMegaTextureTileRef.prototype.bindToSlot = function(n, width, height) {
    this.n = n;
    this.width = width;
    this.height = height;
}
HNMegaTextureTileRef.prototype.touch = function(frameNumber) {
    this.lastUse = frameNumber;
}

var HNMegaTextureLookup = function(textureCache, megaTexture) {
    this.textureCache = textureCache;
    var gl = this.textureCache.gl;

    this.maxLevel = megaTexture.maxLevel;
    this.width = Math.pow(2, this.maxLevel) * 2;
    this.height = Math.pow(2, this.maxLevel);
    this.stride = this.width * 3;
    con.info("lookup table " + this.width + "x" + this.height + " (" + (this.width * this.height * 3) + "b) with up to level " + this.maxLevel);

    this.texture = gl.createTexture();
    gl.bindTexture(gl.TEXTURE_2D, this.texture);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.NEAREST);
    emptyTexImage2D(gl, gl.RGB, this.width, this.height, gl.RGB, gl.UNSIGNED_BYTE);
    gl.bindTexture(gl.TEXTURE_2D, null);

    this.data = new WebGLUnsignedByteArray(this.width * this.height * 3);
    this.changes = [];
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
HNMegaTextureLookup.prototype.fillTileLevel = function(level, lx, ly, lw, ls, tx, ty) {
    var levelWidth = 1 << level;
    lw = Math.min(lw, levelWidth - Math.max(lx, ly));
    if (lw <= 0) {
        // Address is bogus - abort - this happens with poorly constructed images
        // TODO: figure out *why* it happens, this is an ugly hack
        return;
    }
    var dataIndex = levelWidth * 3;
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
HNMegaTextureLookup.prototype.recursiveFillTile = function(tileRef) {
    // Fill self in
    var tx = Math.floor(tileRef.n % this.textureCache.tilesPerSide);
    var ty = Math.floor(tileRef.n / this.textureCache.tilesPerSide);
    this.fillTileLevel(tileRef.level, tileRef.tileX, tileRef.tileY, 1, 1, tx, ty);

    if (tileRef.children[0] || tileRef.children[1] || tileRef.children[2] || tileRef.children[3]) {
        // At least one child exists - slow fill each quadrant (through the pyramid)
        for (var n = 0; n < 4; n++) {
            var childRef = tileRef.children[n];
            if (childRef) {
                // Child is already filled (probably) - skip it
            } else {
                // Fill child with self (and all levels below it)
                for (var level = tileRef.level + 1; level <= this.maxLevel; level++) {
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
                    this.fillTileLevel(level, lx, ly, lwh, lw, tx, ty);
                }
            }
        }
    } else {
        // Leaf node in the quad tree - fill all children in (and all levels below us)
        for (var level = tileRef.level + 1; level <= this.maxLevel; level++) {
            var levelDiff = level - tileRef.level;
            var lx = tileRef.tileX << levelDiff;
            var ly = tileRef.tileY << levelDiff;
            var lw = 1 << levelDiff;
            this.fillTileLevel(level, lx, ly, lw, lw, tx, ty);
        }
    }
}
HNMegaTextureLookup.prototype.processChanges = function() {
    if (this.changes.length == 0) {
        return;
    }

    this.beginUpdate();

    // TODO: ensure we aren't adding AND removing a tile in the same frame (not possible?)
    for (var n = 0; n < this.changes.length; n++) {
        //changedTiles[n].op == "add" "refresh"
        if (this.changes[n].tileRef) {
            // Refresh tile
            this.recursiveFillTile(this.changes[n].tileRef);
        } else {
            // Clear the entire slot
            // Note that there is probably a better way
            this.data = new WebGLUnsignedByteArray(this.width * this.height * 3);
        }
    }

    this.endUpdate();
    this.changes = [];
}
