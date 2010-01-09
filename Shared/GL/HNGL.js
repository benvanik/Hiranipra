/* ---------------------------------------------------------------------------- */
function fixupGL(gl) {
    // Nothing to fix up right now - wait until the next compat break :)
}
function emptyTexImage2D(gl, internalFormat, width, height, format, type) {
    // TODO: remove this when browsers stop sucking
    // Some browsers don't like null image data - if they don't, then make a dummy pixel array and use that
    try {
        gl.texImage2D(gl.TEXTURE_2D, 0, internalFormat, width, height, 0, format, type, null);
    } catch (e) {
        con.warn("browser texImage2D does not accept null - sending up a real blank texture");
        var pixels = new WebGLUnsignedByteArray(width * height * ( internalFormat == gl.RGBA ? 4 : 3 ) );
        gl.texImage2D(gl.TEXTURE_2D, 0, internalFormat, width, height, 0, format, type, pixels);
    }
}
/* ---------------------------------------------------------------------------- */

function HNGLCreate(canvas) {
    con.beginGroupCollapsed("HNGL - setting up GL context");
    var tryGetContext = function(canvas, type) {
        try {
            var context = canvas.getContext(type);
            if (context) {
                con.info("got WebGL context of type " + type);
            }
            return context;
        } catch (e) {
            con.error(e);
            return null;
        }
    };
    var gl = null;
    gl = gl || tryGetContext(canvas, 'experimental-webgl');
    con.assert(gl, "null gl context");
    if (!gl) {
        con.error("unable to get a valid WebGL context");
        con.endGroup();
        return null;
    }
    fixupGL(gl);

    gl.enable(gl.CULL_FACE);
    gl.cullFace(gl.FRONT);
    gl.frontFace(gl.CCW);
    gl.enable(gl.DEPTH_TEST);
    gl.depthFunc(gl.LEQUAL);
    gl.clearDepth(1.0);
    gl.clearColor(0.0, 0.0, 0.0, 1.0);
    gl.enable(gl.BLEND);
    gl.blendFunc(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA);

    con.info("HNGL setup and ready");
    con.endGroup();
    return gl;
}
