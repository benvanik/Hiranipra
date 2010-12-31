var HNProfileGraph = function (width, height, canvas) {
    this.index = 0;
    this.width = width;
    this.height = height;
    canvas.width = width;
    canvas.height = height;
    this.canvas = canvas;
    var ctx = this.canvas.getContext("2d");
    ctx.clearRect(0, 0, width, height);
}
HNProfileGraph.prototype.beginUpdate = function () {
    var ctx = this.canvas.getContext("2d");
    ctx.clearRect(this.index, 0, 1, this.height);
    ctx.fillStyle = "rgb(255,0,0)";
    ctx.fillRect(this.index + 1, 0, 1, this.height);
}
HNProfileGraph.prototype.endUpdate = function () {
    this.index = (this.index + 1) % this.width;
}
HNProfileGraph.prototype.addSample = function (value, maxValue, color) {
    var ctx = this.canvas.getContext("2d");
    if (value >= maxValue) {
        ctx.fillStyle = "rgb(1,0,0)";
    } else {
        if (color) {
            ctx.fillStyle = "rgb(" + color.join(",") + ")";
        } else {
            ctx.fillStyle = "rgb(0,0,0)";
        }
    }
    value = Math.clamp(value, 0, maxValue) / maxValue * this.height;
    ctx.fillRect(this.index, this.height - value, 1, value);
}
