// Creates a single texture that is tilesPerSide*tileSize x tilesPerSide*tileSize pixels
// We also have a framebuffer that we use for doing the uploads - this may be suboptimal, but allows for some fixups
// when input tiles don't match our cache tile size (they can get rescaled on the GPU).

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
    for (var n = 0; n < this.tileCapacity; n++) {
        this.freeList.push(n);
    }

    // map of texture/level/x/y to HNMegaTextureTileRef
    this.tiles = {};
    this.tileList = [];

    // Lists of tiles picked up through update
    this.changedTiles = [];

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
}
HNMegaTextureCache.prototype.endUpdate = function() {
    var gl = this.gl;
    this.quadDrawer.endBatch();
    gl.bindFramebuffer(gl.FRAMEBUFFER, null);
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
    this.tileList.push(tileRef);

    // Find our direct parent and add to the tree
    if (tile.level > 0) {
        var px = Math.floor(tile.tileX / 2);
        var py = Math.floor(tile.tileY / 2);
        // If it doesn't exist, it's ok - we'll get fixed up when it gets added
        tileRef.parent = this.getTileRef(tile.megaTexture.uniqueId, tile.level - 1, px, py);
        if (tileRef.parent) {
            tileRef.parent.children[(tile.tileY % 2) * 2 + (tile.tileX % 2)] = tileRef;
        }
    }
    // Search for our 4 children
    if (tile.level < tile.megaTexture.maxLevel) {
        tileRef.children[0] = this.getTileRef(tile.megaTexture.uniqueId, tile.level + 1, tile.tileX * 2 + 0, tile.tileY * 2 + 0);
        tileRef.children[1] = this.getTileRef(tile.megaTexture.uniqueId, tile.level + 1, tile.tileX * 2 + 1, tile.tileY * 2 + 0);
        tileRef.children[2] = this.getTileRef(tile.megaTexture.uniqueId, tile.level + 1, tile.tileX * 2 + 0, tile.tileY * 2 + 1);
        tileRef.children[3] = this.getTileRef(tile.megaTexture.uniqueId, tile.level + 1, tile.tileX * 2 + 1, tile.tileY * 2 + 1);
        for (var n = 0; n < 4; n++) {
            if (tileRef.children[n]) {
                tileRef.children[n].parent = tileRef;
            }
        }
    }

    this.changedTiles.push({ op: "add", tileRef: tileRef });

    return true;
}
HNMegaTextureCache.prototype.removeTile = function(tileRef) {
    var key = [tileRef.megaTexture.uniqueId, tileRef.level, tileRef.tileX, tileRef.tileY].join(",");
    delete this.tiles[key];
    this.tileList.shift();
    this.freeList.push(tileRef.n);

    var parentRef = null;
    if (tileRef.parent) {
        tileRef.parent.children[(tileRef.tileY % 2) * 2 + (tileRef.tileX % 2)] = null;
        parentRef = tileRef.parent;
        tileRef.parent = null;
    } else if (tileRef.level > 0) {
        // Try really hard to find a parent - any parent
        var tx = tileRef.tileX;
        var ty = tileRef.tileY;
        for (var level = tileRef.level - 1; level >= 0; level--) {
            tx = Math.floor(tx / 2); ty = Math.floor(ty / 2);
            parentRef = this.getTileRef(tileRef.megaTexture.uniqueId, level, tx, ty);
            if (parentRef) {
                break;
            }
        }
    }
    for (var n = 0; n < 4; n++) {
        if (tileRef.children[n]) {
            tileRef.children[n].parent = null;
        }
    }
    tileRef.children = [null, null, null, null];

    // Queue up lookup change - note that it's ok if parent is null here, as it means refresh the entire slot
    this.changedTiles.push({ op: "refresh", tileRef: parentRef, slot: tileRef.slot });

    // Draw black over the slot (needed so subregion updates/etc don't get border artifacts)
    if (true) {
        var sx = Math.floor(tileRef.n % this.tilesPerSide) * this.totalTileSize;
        var sy = Math.floor(tileRef.n / this.tilesPerSide) * this.totalTileSize;
        var sw = this.totalTileSize;
        var sh = this.totalTileSize;
        this.quadDrawer.fill(0, 0, 0, 1, sx, sy, sw, sh);
    }
}
HNMegaTextureCache.prototype.removeUnusedTiles = function(requestedRemovalCount) {
    //con.debug("texture cache full - removing " + requestedRemovalCount + " tiles to make room for new ones");
    this.tileList.sort(function(a, b) { return a.lastUse - b.lastUse; });
    for (var removalCount = 0; (removalCount < requestedRemovalCount) && (this.tileList.length > 0); removalCount++) {
        var tileRef = this.tileList[0];
        if (tileRef.lastUse + 4 >= this.lastFrameNumber) {
            // Recently used - don't evict
            // NOTE: since we are sorted, we know we have hit the limit - abort
            con.warn("texture cache thrashing");
            break;
        }
        this.removeTile(tileRef);
    }
}
HNMegaTextureCache.prototype.clear = function() {
    this.beginUpdate(this.renderFrameNumber);
    var tileList = this.tileList.slice(); // clone
    for (var n = 0; n < tileList.length; n++) {
        var tileRef = tileList[n];
        this.removeTile(tileRef);
    }
    this.endUpdate();
}
HNMegaTextureCache.prototype.getTileRef = function(megaTextureId, level, tileX, tileY) {
    var key = [megaTextureId, level, tileX, tileY].join(",");
    return this.tiles[key];
}
HNMegaTextureCache.prototype.setPass1Uniforms = function(program, feedbackBuffer, megaTexture) {
    var gl = this.gl;
    gl.uniform1f(program.u_mt_bias, -Math.log(feedbackBuffer.downsample) / Math.log(2));
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
    var completedTiles = loader.getCompletedTiles(2, renderFrameNumber);
    if (completedTiles.length > 0) {
        this.beginUpdate(renderFrameNumber);
        var tileCapacityDiff = this.tileList.length + completedTiles.length - this.tileCapacity;
        if (tileCapacityDiff > 0) {
            this.removeUnusedTiles(tileCapacityDiff);
        }
        for (var n = 0; n < completedTiles.length; n++) {
            this.addTile(completedTiles[n]);
        }
        this.endUpdate();

    }

    // Update the quad tree if required
    // TODO: only update every few frames if just adds - removes have to be done right away, though
    if (this.changedTiles.length) {
        this.lookup.beginUpdate();
        this.lookup.processChanges(this.changedTiles);
        this.lookup.endUpdate();
        this.changedTiles = [];
    }
}
HNMegaTextureCache.prototype.processFeedbackData = function(feedbackData, renderFrameNumber, loader) {
    var lastTexId = -1, lastLevel = 0, lastTileX = 0, lastTileY = 0;
    var pixelIndex = 0;
    for (var yy = 0; yy < feedbackData.height; yy++) {
        for (var xx = 0; xx < feedbackData.width; xx++, pixelIndex += 4) {
            // TODO: remove this % - bug in WebKit/Chromium where 1 == 256 instead of 0 (sometimes?)
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
                if (!megaTexture) {
                    // texture not found - that's bad!
                    continue;
                }
                var tile = loader.queue(megaTexture, level, tileX, tileY);
                tile.lastUse = renderFrameNumber;
            }
            if (level > 0) {
                // For each coarser level, touch or request the parent tile
                // TODO: priority (by level)
                var tx = tileX;
                var ty = tileY;
                var lastRef = tileRef;
                for (var l = level - 1; l >= 0; l--) {
                    tx = Math.floor(tx / 2); ty = Math.floor(ty / 2);
                    var parentRef = lastRef ? lastRef.parent : this.getTileRef(texId, l, tx, ty);
                    if (parentRef) {
                        parentRef.touch(renderFrameNumber);
                        if (lastRef) {
                            lastRef.parent = parentRef;
                        }
                        lastRef = parentRef;
                    } else {
                        var tile = loader.queue(megaTexture, l, tx, ty);
                        tile.lastUse = renderFrameNumber;
                        lastRef = null;
                    }
                }
            }
        }
    }
}
