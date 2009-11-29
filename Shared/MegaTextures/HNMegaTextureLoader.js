// If the megatexture given has 'getTileData', then add to a worker thread queue (assumes cpu processing)
// Otherwise, if it has 'getTileUrl', we do it all async
// TODO: worker threads (once Chrome supports them more)

var HNMegaTextureLoader = function() {
    con.info("loader setup");
    this.suppressLoads = false;

    // map of texture/level/x/y to HNMegaTextureTileRef
    this.pendingTiles = {};
    this.completedTiles = {};

    this.maxInFlightRequests = 6;
    this.inFlightRequests = [];
    this.pendingRequests = [];

    var me = this;
    this.worker = new Worker("HNMegaTextureLoader-Worker.js");
    this.worker.onmessage = function(event) {
        var result = JSON.parse(event.data);
        var tile = me.pendingTiles[result.key];
        if (!tile) {
            con.warn("unable to find pending tile " + result.key + " on completion");
            return;
        }
        // TODO: check error?
        // Pack result into tile
        tile.loadPixels(result.width, result.height, result.pixels);
        me.tileSucceeded(tile);
    }
}
HNMegaTextureLoader.prototype.tileSucceeded = function(tile) {
    //con.debug("tile load succeeded " + tile.level + "@" + tile.tileX + "," + tile.tileY);
    var key = [tile.megaTexture.uniqueId, tile.level, tile.tileX, tile.tileY].join(",");
    this.completedTiles[key] = tile;
    var index = this.inFlightRequests.indexOf(tile);
    if (index >= 0) {
        this.inFlightRequests.remove(index);
    }
}
HNMegaTextureLoader.prototype.tileFailed = function(tile) {
    con.error("tile load failed " + tile.level + "@" + tile.tileX + "," + tile.tileY);
    // TODO: retry logic
    // NOTE: we don't remove so the tile is never requested again
    var index = this.inFlightRequests.indexOf(tile);
    if (index >= 0) {
        this.inFlightRequests.remove(index);
    }
}
HNMegaTextureLoader.prototype.queue = function(megaTexture, level, tileX, tileY) {
    var key = [megaTexture.uniqueId, level, tileX, tileY].join(",");
    var existingTile = this.pendingTiles[key];
    if (existingTile) {
        return existingTile;
    }

    var tile = null;
    if (megaTexture.getTileData) {
        tile = HNMegaTextureTile.createPlaceholder(megaTexture, level, tileX, tileY);
    } else if (megaTexture.getTileUrl) {
        // URL - create as async img
        var url = megaTexture.getTileUrl(level, tileX, tileY);
        if (url) {
            //con.debug("starting async download of tile " + level + "@" + tileX + "," + tileY + " - " + url);
            tile = HNMegaTextureTile.fromUrl(megaTexture, level, tileX, tileY, url);
        } else {
            con.warning("failed to get url for tile " + level + "@" + tileX + "," + tileY);
        }
    } else {
        con.error("unknown megatexture tile retrieval format");
    }
    if (!tile) {
        return null;
    }

    this.pendingTiles[key] = tile;
    this.pendingRequests.push(tile);
    tile.setCallbacks(this, this.tileSucceeded, this.tileFailed);

    // NOTE: we don't want to pump here, I think, because then we don't get a chance to sort things first

    return tile;
}
HNMegaTextureLoader.prototype.pump = function(renderFrameNumber) {
    if (this.pendingRequests.length == 0) {
        // Nothing to do
        return;
    }

    // TODO: a more clever sort - right now we always take the lowest (coarsest) level first
    this.pendingRequests.sort(function(a, b) { return a.level - b.level; });
    
    while (this.pendingRequests.length > 0) {
        if (this.inFlightRequests.length > this.maxInFlightRequests) {
            // No more can go
            break;
        }
        var request = this.pendingRequests.shift();
        if (request.lastUse + 4 < renderFrameNumber) {
            // Request is too old - ignore it
            continue;
        }
        this.inFlightRequests.push(request);
        request.beginRequest(this);
    }
}
HNMegaTextureLoader.prototype.getCompletedTiles = function(max, renderFrameNumber) {
    if (this.suppressLoads) {
        return [];
    }
    var completedTiles = [];
    var removalKeys = [];
    for (var key in this.completedTiles) {
        var tile = this.pendingTiles[key];
        removalKeys.push(key);
        delete this.pendingTiles[key];
        if (tile.lastUse + 4 < renderFrameNumber) {
            // Tile has not been requested for awhile - don't put it in the cache
        } else {
            // Valid - queue up
            completedTiles.push(tile);
            if (max && completedTiles.length >= max) {
                // hit the max requested - abort for now
                break;
            }
        }
    }
    for (var n = 0; n < removalKeys.length; n++) {
        var key = removalKeys[n];
        delete this.completedTiles[key];
    }
    return completedTiles;
}
