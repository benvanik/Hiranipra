// callbacks are of the form [this, function]
var HNTimer = function (updateCallback, renderCallback) {
    this.tickCount = 0;
    this.updateCount = 0;
    this.updateInterval = 1;
    this.updatesPerSecond = 0;
    this.renderCount = 0;
    this.renderInterval = 1;
    this.rendersPerSecond = 0;
    this.lastUpdateTime = (new Date().getTime());
    this.lastRenderTime = (new Date().getTime());
    this.updateCallback = updateCallback;
    this.renderCallback = renderCallback;
    this.intervalId = null;
    this.active = false;
}
HNTimer.prototype.start = function () {
    this.stop();
    this.lastUpdateTime = (new Date().getTime());
    this.lastRenderTime = (new Date().getTime());
    var minInterval = Math.min(this.updateInterval, this.renderInterval);
    var timer = this;
    this.intervalId = window.setInterval(function () {
        timer.tick();
    }, 16 * minInterval);
    this.active = true;
}
HNTimer.prototype.stop = function () {
    if (!this.active) {
        return;
    }
    window.clearInterval(this.intervalId);
    this.intervalId = null;
    this.active = false;
}
HNTimer.prototype.tick = function () {
    var time = (new Date().getTime());
    this.tickCount++;
    if (this.tickCount % this.updateInterval == 0) {
        var delta = (time - this.lastUpdateTime) / 1000.0;
        this.lastUpdateTime = time;
        this.updateCount++;
        this.updateCallback[1].call(this.updateCallback[0], delta);
    }
    if (this.tickCount % this.renderInterval == 0) {
        var delta = (time - this.lastRenderTime) / 1000.0;
        this.lastRenderTime = time;
        this.renderCount++;
        this.renderCallback[1].call(this.renderCallback[0], delta);
    }
    // TODO: calculate */second values
    this.updatesPerSecond = 0;
    this.rendersPerSecond = 0;

    // TODO: perhaps use a timeout instead, and given the duration of this function adjust the next timeout (could help to prevent drift)
}
