onmessage = function (event) {
    // TODO: only parse if required
    //var message = {
    //    key: key,
    //    megaTexture: megaTexture,
    //    level: level,
    //    tileX: tileX,
    //    tileY: tileY
    //};
    var message = JSON.parse(event.data);

    //postMessage("worker got tile " + megaTexture.uniqueId + "." + level + "@" + tileX + "," + tileY);
    var result = {
        key: message.key,
        width: 0,
        height: 0,
        pixels: 0
    };
    // TODO: only pack in JSON if required
    postMessage(JSON.stringify(result));
}
