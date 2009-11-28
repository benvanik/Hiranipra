var HNGLShader = function(gl, id) {
    this.gl = gl;
    this.id = id;
}
HNGLShader.prototype.dispose = function() {
    this.gl.deleteShader(this.id);
    this.id = null;
    this.gl = null;
}
HNGLShader.fromSource = function(gl, type, source) {
    var id = gl.createShader(type);
    gl.shaderSource(id, source);
    gl.compileShader(id);
    if (!gl.getShaderParameter(id, gl.COMPILE_STATUS)) {
        con.error("failed to compile " + (type == gl.VERTEX_SHADER ? "vertex shader" : "fragment shader") + ": " + gl.getShaderInfoLog(id));
        gl.deleteShader(id);
        return null;
    }
    var shader = new HNGLShader(gl, id);
    // ??
    return shader;
}
HNGLShader.fromScriptElement = function(gl, element) {
    var type;
    switch (element.type) {
        case "x-shader/x-vertex":
            type = gl.VERTEX_SHADER;
            break;
        case "x-shader/x-fragment":
            type = gl.FRAGMENT_SHADER;
            break;
        default:
            con.error("unknown script element type " + element.type);
            return null;
    }
    var source = $(scriptElement).text();
    return HNGLShader.fromSource(gl, type, source);
}

var HNGLProgram = function(gl, id) {
    this.gl = gl;
    this.id = id;
}
HNGLProgram.prototype.dispose = function() {
    this.gl.deleteProgram(this.id);
    this.id = null;
    this.gl = null;
}
HNGLProgram.prototype.begin = function() { }
HNGLProgram.prototype.end = function() { }
HNGLProgram.fromShaders = function(gl, vertexShader, fragmentShader) {
    var id = gl.createProgram();
    gl.attachShader(id, vertexShader.id);
    gl.attachShader(id, fragmentShader.id);
    gl.linkProgram(id);
    if (!gl.getProgramParameter(id, gl.LINK_STATUS)) {
        con.error("failed to link program: " + gl.getProgramInfoLog(id));
        gl.deleteProgram(id);
        return null;
    }
    gl.validateProgram(id);
    if (!gl.getProgramParameter(id, gl.VALIDATE_STATUS)) {
        con.error("failed to validate program: " + gl.getProgramInfoLog(id));
        gl.deleteProgram(id);
        return null;
    }
    var program = new HNGLProgram(gl, id);
    program.uniformCount = gl.getProgramParameter(id, gl.ACTIVE_UNIFORMS);
    for (var n = 0; n < program.uniformCount; n++) {
        var uniform = gl.getActiveUniform(id, n);
        program[uniform.name] = n;
        con.debug("uniform " + uniform.name + " : " + n);
    }
    program.attribCount = gl.getProgramParameter(id, gl.ACTIVE_ATTRIBUTES);
    for (var n = 0; n < program.attribCount; n++) {
        var attrib = gl.getActiveAttrib(id, n);
        program[attrib.name] = n;
        con.debug("attrib " + attrib.name + " : " + n);
    }
    con.info("successfully linked program");
    return program;
}
HNGLProgram.fromSources = function(gl, vertexSource, fragmentSource) {
    var vertexShader = null;
    var fragmentShader = null;
    try {
        vertexShader = HNGLShader.fromSource(gl, gl.VERTEX_SHADER, vertexSource);
        fragmentShader = HNGLShader.fromSource(gl, gl.FRAGMENT_SHADER, fragmentSource);
        if (!vertexShader || !fragmentShader) {
            return null;
        }
        var program = HNGLProgram.fromShaders(gl, vertexShader, fragmentShader);
        // ??
        return program;
    } finally {
        if (fragmentShader) {
            fragmentShader.dispose();
        }
        if (vertexShader) {
            vertexShader.dispose();
        }
    }
}
HNGLProgram.fromScriptElements = function(gl, vertexElement, fragmentElement) {
    var vertexShader = null;
    var fragmentShader = null;
    try {
        vertexShader = HNGLShader.fromScriptElement(gl, vertexElement);
        fragmentShader = HNGLShader.fromScriptElement(gl, fragmentElement);
        if (!vertexShader || !fragmentShader) {
            return null;
        }
        var program = HNGLProgram.fromShaders(gl, vertexShader, fragmentShader);
        // ??
        return program;
    } finally {
        if (fragmentShader) {
            fragmentShader.dispose();
        }
        if (vertexShader) {
            vertexShader.dispose();
        }
    }
}
