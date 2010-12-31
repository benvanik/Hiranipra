// level 0 = tileSize x tileSize
// level 1 = tileSize * 2 x tileSize * 2
// ...

var HNMegaTexture = function (uniqueId, width, height, tileSize, tileOverlap) {
    this.uniqueId = uniqueId;
    this.width = width;
    this.height = height;
    this.tileSize = tileSize;
    this.tileOverlap = tileOverlap;
    this.totalTileSize = tileSize + tileOverlap * 2;
    this.levelCount = Math.ceil(Math.log(Math.max(width, height)) / Math.log(2));
    this.levelOffset = Math.ceil(Math.log(this.tileSize) / Math.log(2));
    this.maxLevel = this.levelCount - this.levelOffset;
}

var HNTestMegaTexture = function (uniqueId, width, height, tileSize, tileOverlap) {
    this.canvas = document.createElement("canvas");
    this.canvas.width = tileSize + tileOverlap * 2;
    this.canvas.height = tileSize + tileOverlap * 2;
    HNMegaTexture.call(this, uniqueId, width, height, tileSize, tileOverlap);
}
HNTestMegaTexture.prototype.getTileData = function (level, tileX, tileY) {
    var realLevel = level + this.levelOffset;
    var levelScale = Math.pow(2, (this.levelCount - realLevel));
    var levelWidth = Math.ceil(this.width / levelScale);
    var levelHeight = Math.ceil(this.height / levelScale);
    var tilesWide = Math.ceil(levelWidth / this.tileSize);
    var tilesHigh = Math.ceil(levelHeight / this.tileSize);
    var tx = tileX * this.tileSize;
    var ty = tileY * this.tileSize;
    var tw = Math.min(this.totalTileSize, levelWidth - tx);
    var th = Math.min(this.totalTileSize, levelHeight - ty);
    if (tileX == 0) {
        tx += this.tileOverlap;
        tw -= this.tileOverlap;
    }
    if (tileY == 0) {
        tx += this.tileOverlap;
        th -= this.tileOverlap;
    }
    if (tileX == tilesWide - 1) {
        th -= this.tileOverlap;
    }
    if (tileY == tilesHigh - 1) {
        th -= this.tileOverlap;
    }

    // TODO: canvas capture? webgl byte array? ImageData?
    this.canvas.width = tw;
    this.canvas.height = th;
    var ctx = this.canvas.getContext("2d");
    ctx.clearRect(0, 0, tw, th);
    ctx.fillStyle = "rgb(" + Math.random() * 255 + ",0,0,1)";
    ctx.fillRect(0, 0, tw, th);
    ctx.fillStyle = "rgb(255,255,255,1)";
    ctx.fillText(level + "@" + tileX + "," + tileY, 5, 5);
    var result = {
        width: this.totalTileSize,
        height: this.totalTileSize,
        data: ctx.getImageData(0, 0, tw, th)
    };
    return result;
}

var HNDeepZoomMegaTexture = function (uniqueId, dziXml, dziUrl) {
    // Grab an XML doc
    var xmlDoc = null;
    if (typeOf(dziXml) == "string") {
        xmlDoc = (new DOMParser()).parseFromString(dziXml, "text/xml");
    } else if (typeOf(dziXml) == "object") {
        if (dziXml.contentType && dziXml.contentType == "text/xml") {
            xmlDoc = dziXml;
        } else {
            // TODO: support JSON input?
        }
    }
    con.assert(xmlDoc != null, "unable to get an XML document");

    // Parse
    var imageEl = xmlDoc.getElementsByTagName("Image")[0];
    var tileSize = parseInt(imageEl.getAttribute("TileSize"));
    var tileOverlap = parseInt(imageEl.getAttribute("Overlap"));
    var tileFormat = imageEl.getAttribute("Format");
    var sizeEl = imageEl.getElementsByTagName("Size")[0];
    var width = parseInt(sizeEl.getAttribute("Width"));
    var height = parseInt(sizeEl.getAttribute("Height"));

    this.dziUrl = dziUrl;
    this.contentUrl = dziUrl.replace(/(\.\w+)?$/, "_files/");
    this.tileFormat = tileFormat;

    con.info("parsed DeepZoom image from " + dziUrl + ": " + width + "x" + height + ", tile " + tileSize + "/" + tileOverlap + "." + tileFormat);

    HNMegaTexture.call(this, uniqueId, width, height, tileSize, tileOverlap);
}
HNDeepZoomMegaTexture.prototype.getTileUrl = function (level, tileX, tileY) {
    var realLevel = level + this.levelOffset;
    var url = [this.contentUrl, realLevel, "/", tileX, "_", tileY, ".", this.tileFormat].join("");
    return url;
}
