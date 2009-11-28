/* ---------------------------------------------------------------------------- */
// This block only exists until the browsers stabilize a bit
// The WebGL spec was recently updated to replace the Canvas prefix on types with the WebGL prefix.
// For compatibility reasons we set up aliases to from the WebGL prefixed typename to the
// Canvas prefixed name for the benefit of older builds of WebKit and Mozilla
if (!("WebGLFloatArray" in window)) {
    con.warn("browser is old and is using Canvas array types");
    WebGLFloatArray = window.CanvasFloatArray;
}
if (!("WebGLByteArray" in window))
    WebGLByteArray = window.CanvasByteArray;
if (!("WebGLIntArray" in window))
    WebGLIntArray = window.CanvasIntArray;
if (!("WebGLShortArray" in window))
    WebGLShortArray = window.CanvasShortArray;
if (!("WebGLUnsignedByteArray" in window))
    WebGLUnsignedByteArray = window.CanvasUnsignedByteArray;
if (!("WebGLUnsignedIntArray" in window))
    WebGLUnsignedIntArray = window.CanvasUnsignedIntArray;
if (!("WebGLUnsignedShortArray" in window))
    WebGLUnsignedShortArray = window.CanvasUnsignedShortArray;
/* ---------------------------------------------------------------------------- */
function fixupGL(gl) {
    if (!gl.getShaderi) {
        gl.getShaderi = gl.getShaderParameter;
    }
    if (!gl.getProgrami) {
        gl.getProgrami = gl.getProgramParameter;
    }
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
        delete pixels;
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
    gl = gl || tryGetContext(canvas, 'moz-webgl');
    gl = gl || tryGetContext(canvas, 'webkit-3d');
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
