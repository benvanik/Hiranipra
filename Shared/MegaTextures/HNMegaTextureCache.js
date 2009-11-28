// Creates a single texture that is tilesPerSide*tileSize x tilesPerSide*tileSize pixels
// We also have a framebuffer that we use for doing the uploads - this may be suboptimal, but allows for some fixups
// when input tiles don't match our cache tile size (they can get rescaled on the GPU).

var HNMegaTextureTileRef = function(tile) {
    this.megaTexture = tile.megaTexture;
    this.level = tile.level;
    this.tileX = tile.tileX;
    this.tileY = tile.tileY;
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
}
HNMegaTextureLookup.prototype.processChanges = function(addedTiles, removedTiles) {
    // TODO: something smart with added/removed tiles - for now, we just rebuild every frame
    var gl = this.textureCache.gl;
    this.data = new WebGLUnsignedByteArray(this.width * this.height * 3);
    for (var key in this.textureCache.tiles) {
        var tileRef = this.textureCache.tiles[key];
        var slot = 0; // TODO: get

        for (var level = tileRef.level; level <= tileRef.megaTexture.maxLevel; level++) {
            var dataIndex = 0; // slot offset
            dataIndex += (1 << level) * 3;
            var levelDiff = level - tileRef.level;
            var levelX = tileRef.tileX << levelDiff;
            var levelY = tileRef.tileY << levelDiff;
            var lw = 1 << levelDiff;
            dataIndex += (levelY * (this.width * 3)) + (levelX * 3);
            var tx = Math.floor(tileRef.n % this.textureCache.tilesPerSide);
            var ty = Math.floor(tileRef.n / this.textureCache.tilesPerSide);
            for (var y = levelY; y < levelY + lw; y++) {
                var rowIndex = dataIndex;
                for (var x = levelX; x < levelX + lw; x++, rowIndex += 3) {
                    var oldw = this.data[rowIndex + 2];
                    if (oldw && (oldw < lw)) {
                        continue;
                    }
                    this.data[rowIndex + 0] = tx;
                    this.data[rowIndex + 1] = ty;
                    this.data[rowIndex + 2] = lw;
                }
                dataIndex += this.width * 3;
            }
        }
    }

    gl.bindTexture(gl.TEXTURE_2D, this.texture);
    gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGB, this.width, this.height, 0, gl.RGB, gl.UNSIGNED_BYTE, this.data);
    gl.bindTexture(gl.TEXTURE_2D, null);
}

var HNMegaTextureCache = function(gl, tileSize, tileOverlap, tilesPerSide) {
    this.gl = gl;
    this.totalTileSize = tileSize + (tileOverlap * 2);
    this.tileSize = tileSize;
    this.tileOverlap = tileOverlap;
    this.tilesPerSide = tilesPerSide;
    this.tileCapacity = tilesPerSide * tilesPerSide;
    this.width = this.height = this.totalTileSize * tilesPerSide;

    con.info("cache " + this.width + "x" + this.height + "@" + this.totalTileSize + " (" + this.tileCapacity + " total tiles)");

    this.texture = gl.createTexture();
    gl.bindTexture(gl.TEXTURE_2D, this.texture);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
    emptyTexImage2D(gl, gl.RGB, this.width, this.height, gl.RGB, gl.UNSIGNED_BYTE);
    gl.bindTexture(gl.TEXTURE_2D, null);

    this.framebuffer = gl.createFramebuffer();
    gl.bindFramebuffer(gl.FRAMEBUFFER, this.framebuffer);
    gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0, gl.TEXTURE_2D, this.texture, 0);
    gl.bindFramebuffer(gl.FRAMEBUFFER, null);

    this.freeList = [];
    for (var n = 0; n < this.tileCapacity; n++)
        this.freeList.push(n);

    // map of texture/level/x/y to HNMegaTextureTileRef
    this.tiles = [];

    this.lookup = new HNMegaTextureLookup(this);
    this.megaTextures = {};

    this.quadDrawer = new HNGLQuadDrawer(gl);
}
HNMegaTextureCache.prototype.dispose = function() {
    var gl = this.gl;
    this.lookup.dispose();
    this.lookup = null;
    this.quadDrawer.dispose();
    this.quadDrawer = null;
    gl.deleteTexture(this.texture);
    this.texture = null;
    gl.deleteFramebuffer(this.framebuffer);
    this.framebuffer = null;
    this.gl = null;
}
HNMegaTextureCache.prototype.registerMegaTexture = function(megaTexture) {
    con.info("HNMegaTextureCache registered texture " + megaTexture.uniqueId);
    this.megaTextures[megaTexture.uniqueId] = megaTexture;
    // TODO: expand lookup/assign slot/etc?
}
HNMegaTextureCache.prototype.unregisterMegaTexture = function(megaTexture) {
    delete this.megaTextures[megaTexture.uniqueId];
    con.info("HNMegaTextureCache unregistered texture " + megaTexture.uniqueId);
}
HNMegaTextureCache.prototype.beginUpdate = function(frameNumber) {
    var gl = this.gl;
    gl.bindFramebuffer(gl.FRAMEBUFFER, this.framebuffer);
    this.quadDrawer.beginBatch(this.width, this.height);
    this.lastFrameNumber = frameNumber;
    this.addedTiles = [];
    this.removedTiles = [];
}
HNMegaTextureCache.prototype.endUpdate = function() {
    var gl = this.gl;
    this.quadDrawer.endBatch();
    gl.bindFramebuffer(gl.FRAMEBUFFER, null);

    // Update the quad tree
    this.lookup.beginUpdate();
    this.lookup.processChanges(this.addedTiles, this.removedTiles);
    this.lookup.endUpdate();
    this.addedTiles = [];
    this.removedTiles = [];
}
HNMegaTextureCache.prototype.addTile = function(tile) {
    var gl = this.gl;

    var key = [tile.megaTexture.uniqueId, tile.level, tile.tileX, tile.tileY].join(",");
    con.assert(!this.tiles[key], "re-adding existing tile");

    if (this.freeList.length == 0) {
        con.warn("tile cache full - unable to add tile");
        return false;
    }

    // TODO: maybe not do this here?
    var texture = tile.uploadTexture(gl);
    if (!texture) {
        return false;
    }

    var n = this.freeList.pop();
    var sx = Math.floor(n % this.tilesPerSide) * this.totalTileSize;
    var sy = Math.floor(n / this.tilesPerSide) * this.totalTileSize;
    var sw = texture.width;
    var sh = texture.height;
    if (this.tileOverlap) {
        if (tile.tileX == 0) {
            sx += this.tileOverlap;
        }
        if (tile.tileY == 0) {
            sy += this.tileOverlap;
        }
    }
    // TODO: rescale if smaller or larger than native tile size
    this.quadDrawer.draw(texture.id, sx, sy, sw, sh, false);
    texture.dispose();

    var tileRef = new HNMegaTextureTileRef(tile);
    tileRef.bindToSlot(n, texture.width, texture.height);
    tileRef.touch(this.lastFrameNumber);
    this.tiles[key] = tileRef;

    this.addedTiles.push(tileRef);

    return true;
}
HNMegaTextureCache.prototype.removeUnusedTiles = function() {
    // TODO: more efficient - luckily, we are bounded by tileCapacity, which is never very large
    for (var key in this.tiles) {
        var tileRef = this.tiles[key];
        if (tileRef.lastUse + 4 < this.lastFrameNumber) {
            // Remove
            this.removedTiles.push(tileRef);
            delete this.tiles[key];
            this.freeList.push(tileRef.n);

            // Draw black over the slot (needed so subregion updates/etc don't get border artifacts)
            var sx = Math.floor(tileRef.n % this.tilesPerSide) * this.totalTileSize;
            var sy = Math.floor(tileRef.n / this.tilesPerSide) * this.totalTileSize;
            var sw = this.totalTileSize;
            var sh = this.totalTileSize;
            this.quadDrawer.fill(0, 0, 0, 1, sx, sy, sw, sh);
        }
    }
}
HNMegaTextureCache.prototype.getTileRef = function(megaTextureId, level, tileX, tileY) {
    var key = [megaTextureId, level, tileX, tileY].join(",");
    return this.tiles[key];
}
HNMegaTextureCache.prototype.setPass1Uniforms = function(program, feedbackBuffer, megaTexture) {
    var gl = this.gl;
    gl.uniform1f(program.u_mt_bias, -Math.floor(Math.log(feedbackBuffer.downsample) / Math.log(2)));
    gl.uniform4f(program.u_mt_tex, megaTexture.width, megaTexture.height, megaTexture.tileSize, megaTexture.uniqueId);
}
HNMegaTextureCache.prototype.setPass2Uniforms = function(program, megaTexture) {
    var gl = this.gl;
    gl.uniform4f(program.u_mt_tex, megaTexture.width, megaTexture.height, megaTexture.tileSize, megaTexture.uniqueId);
    gl.uniform4f(program.u_mt_texCache, this.width, this.height, this.lookup.width, this.lookup.height);
    gl.uniform4f(program.u_mt_slot, 0, 0, this.tileOverlap, 0);
    gl.uniform1i(program.s_mt_lookup, 0);
    gl.uniform1i(program.s_mt_texCache, 1);
    gl.activeTexture(gl.TEXTURE0);
    gl.bindTexture(gl.TEXTURE_2D, this.lookup.texture);
    gl.activeTexture(gl.TEXTURE1);
    gl.bindTexture(gl.TEXTURE_2D, this.texture);
    gl.activeTexture(gl.TEXTURE0);
}
HNMegaTextureCache.prototype.processCompletedTiles = function(renderFrameNumber, loader) {
    // Limit to just a few tiles per frame for now
    var completedTiles = loader.getCompletedTiles(2);
    if (completedTiles.length > 0) {
        this.beginUpdate(renderFrameNumber);
        this.removeUnusedTiles();
        for (var n = 0; n < completedTiles.length; n++) {
            this.addTile(completedTiles[n]);
        }
        this.endUpdate();
    }
}
HNMegaTextureCache.prototype.processFeedbackData = function(feedbackData, renderFrameNumber, loader) {
    var lastTexId = 0, lastLevel = 0, lastTileX = 0, lastTileY = 0;
    var pixelIndex = 0;
    for (var yy = 0; yy < feedbackData.height; yy++) {
        for (var xx = 0; xx < feedbackData.width; xx++, pixelIndex += 4) {
            // TODO: remove this % - bug in WebKit/Chromium where 1 == 256 instead of 0
            var texId = feedbackData.pixels[pixelIndex + 3] % 256;
            if (texId == 0) {
                continue;
            }
            var level = feedbackData.pixels[pixelIndex + 0] % 256;
            var tileX = feedbackData.pixels[pixelIndex + 1] % 256;
            var tileY = feedbackData.pixels[pixelIndex + 2] % 256;
            if ((texId == lastTexId) && (level == lastLevel) && (tileX == lastTileX) && (tileY == lastTileY)) {
                continue;
            }
            lastTexId = texId;
            lastLevel = level;
            lastTileX = tileX;
            lastTileY = tileY;
            var megaTexture = null;
            var tileRef = this.getTileRef(texId, level, tileX, tileY);
            if (tileRef) {
                megaTexture = tileRef.megaTexture;
                tileRef.touch(renderFrameNumber);
            } else {
                megaTexture = this.megaTextures[texId];
                con.assert(megaTexture, "megatexture not found - either not registered or bogus data");
                loader.queue(megaTexture, level, tileX, tileY);
            }
            if (level > 0) {
                // For each coarser level, touch or request the parent tile
                // TODO: priority (by level)                
                var tx = tileX;
                var ty = tileY;
                for (var l = level - 1; l >= 0; l--) {
                    tx = Math.floor(tx / 2); ty = Math.floor(ty / 2);
                    var parentRef = this.getTileRef(texId, l, tx, ty);
                    if (parentRef) {
                        parentRef.touch(renderFrameNumber);
                    } else {
                        loader.queue(megaTexture, l, tx, ty);
                    }
                }
            }
        }
    }
}
