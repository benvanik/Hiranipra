// If the megatexture given has 'getTileData', then add to a worker thread queue (assumes cpu processing)
// Otherwise, if it has 'getTileUrl', we do it all async
// TODO: worker threads! queuing! everything!

var HNMegaTextureLoader = function() {
    con.info("loader setup");
    // map of texture/level/x/y to HNMegaTextureTileRef
    this.pendingTiles = {};
    this.completedTiles = {};

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
}
HNMegaTextureLoader.prototype.tileFailed = function(tile) {
    con.error("tile load failed " + tile.level + "@" + tile.tileX + "," + tile.tileY);
    // TODO: retry logic
    // NOTE: we don't remove so the tile is never requested again
}
HNMegaTextureLoader.prototype.queue = function(megaTexture, level, tileX, tileY) {
    var key = [megaTexture.uniqueId, level, tileX, tileY].join(",");
    var existingTile = this.pendingTiles[key];
    if (existingTile) {
        return existingTile;
    }

    var tile = null;
    if (megaTexture.getTileData) {
        // TODO: if the browser supports sending native objects, do that instead of JSON'ing them
        con.debug("posting message to worker for tile " + level + "@" + tileX + "," + tileY);
        var message = {
            key: key,
            megaTexture: megaTexture,
            level: level,
            tileX: tileX,
            tileY: tileY
        };
        //this.worker.postMessage(JSON.stringify(message));
        tile = HNMegaTextureTile.createPlaceholder(megaTexture, level, tileX, tileY);
        var tileData = megaTexture.getTileData(level, tileX, tileY);
        tile.loadPixels(tileData.width, tileData.height, tileData.data);
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

    tile.setCallbacks(this, this.tileSucceeded, this.tileFailed);
    return tile;
}
HNMegaTextureLoader.prototype.getCompletedTiles = function(max) {
    var completedTiles = [];
    var removalKeys = [];
    for (var key in this.completedTiles) {
        var tile = this.pendingTiles[key];
        completedTiles.push(tile);
        removalKeys.push(key);
        delete this.pendingTiles[key];
        if (max && completedTiles.length >= max) {
            // hit the max requested - abort for now
            break;
        }
    }
    for (var n = 0; n < removalKeys.length; n++) {
        var key = removalKeys[n];
        delete this.completedTiles[key];
    }
    return completedTiles;
}
