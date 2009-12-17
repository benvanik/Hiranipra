var HN2DViewport = function() {
    this.viewportWidth = 500;
    this.viewportHeight = 500;

    this.x = 0.0;
    this.y = 0.0;
    this.scale = 1.0;
}
HN2DViewport.prototype.resize = function(width, height) {
    this.viewportWidth = width;
    this.viewportHeight = height;
}
HN2DViewport.prototype.update = function(delta) {
}
