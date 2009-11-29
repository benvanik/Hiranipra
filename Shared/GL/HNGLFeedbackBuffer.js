var HNGLFeedbackBuffer = function(gl, downsample, updateInterval, useDepth) {
    this.gl = gl;
    this.downsample = downsample;
    this.updateInterval = updateInterval;
    this.useDepth = useDepth;
    this.texture = null;
    this.pixels = null;

    this.framebuffer = gl.createFramebuffer();
    this.depthBuffer = gl.createRenderbuffer();
}
HNGLFeedbackBuffer.prototype.dispose = function() {
    var gl = this.gl;
    gl.deleteTexture(this.texture);
    this.texture = null;
    if (this.depthBuffer) {
        gl.deleteRenderbuffer(this.depthBuffer);
        this.depthBuffer = null;
    }
    gl.deleteFramebuffer(this.framebuffer);
    this.framebuffer = null;
    this.gl = null;
}
HNGLFeedbackBuffer.prototype.resize = function(viewportWidth, viewportHeight) {
    var gl = this.gl;
    this.viewportWidth = viewportWidth;
    this.viewportHeight = viewportHeight;
    this.width = Math.floor(viewportWidth / this.downsample);
    this.height = Math.floor(viewportHeight / this.downsample);
    con.info("resizing feedback buffer to viewport " + viewportWidth + "x" + viewportHeight + "/" + this.downsample + " = " + this.width + "x" + this.height);

    if (this.texture) {
        gl.deleteTexture(this.texture);
        this.texture = null;
    }
    this.texture = gl.createTexture();
    gl.bindTexture(gl.TEXTURE_2D, this.texture);
    gl.pixelStorei(gl.PACK_ALIGNMENT, 1);
    gl.pixelStorei(gl.UNPACK_ALIGNMENT, 1);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.NEAREST);
    emptyTexImage2D(gl, gl.RGBA, this.width, this.height, gl.RGBA, gl.UNSIGNED_BYTE);
    gl.bindTexture(gl.TEXTURE_2D, null);

    gl.bindFramebuffer(gl.FRAMEBUFFER, this.framebuffer);
    if (this.useDepth) {
        gl.bindRenderbuffer(gl.RENDERBUFFER, this.depthBuffer);
        gl.renderbufferStorage(gl.RENDERBUFFER, gl.DEPTH_COMPONENT16, this.width, this.height);
        gl.bindRenderbuffer(gl.RENDERBUFFER, null);
        gl.framebufferRenderbuffer(gl.FRAMEBUFFER, gl.DEPTH_ATTACHMENT, gl.RENDERBUFFER, this.depthBuffer);
    }
    gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0, gl.TEXTURE_2D, this.texture, 0);
    gl.bindFramebuffer(gl.FRAMEBUFFER, null);
}
HNGLFeedbackBuffer.prototype.begin = function() {
    var gl = this.gl;
    gl.viewport(0, 0, this.width, this.height);
    gl.bindFramebuffer(gl.FRAMEBUFFER, this.framebuffer);
}
HNGLFeedbackBuffer.prototype.end = function() {
    var gl = this.gl;
    gl.bindFramebuffer(gl.FRAMEBUFFER, null);
    gl.viewport(0, 0, this.viewportWidth, this.viewportHeight);
}
HNGLFeedbackBuffer.prototype.readPixels = function() {
    var gl = this.gl;
    // NOTE: this only works if our framebuffer is bound and we have the right viewport set
    var pixels = gl.readPixels(0, 0, this.width, this.height, gl.RGBA, gl.UNSIGNED_BYTE);
    return {
        width: this.width,
        height: this.height,
        pixels: pixels
    };
}
