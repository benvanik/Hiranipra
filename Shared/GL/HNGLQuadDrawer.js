var HNGLQuadDrawer = function(gl) {
    con.beginGroupCollapsed("HNGL - creating quad drawer");
    try {
        this.texProgram = HNGLProgram.fromSources(gl,
            [
                "uniform mat4 u_viewProjMatrix;",
                "attribute vec2 a_pos;",
                "attribute vec2 a_tex0;",
                "varying vec2 v_tex0;",
                "void main() {",
                "    gl_Position = u_viewProjMatrix * vec4( a_pos, 0.0, 1.0 );",
                "    v_tex0 = a_tex0;",
                "}"
            ].join("\n"),
            [
                "uniform vec4 u_color;",
                "uniform sampler2D s_tex0;",
                "varying vec2 v_tex0;",
                "void main() {",
                "    gl_FragColor = u_color * texture2D( s_tex0, v_tex0 );",
                "}"
            ].join("\n")
        );
        this.colorProgram = HNGLProgram.fromSources(gl,
            [
                "uniform mat4 u_viewProjMatrix;",
                "attribute vec2 a_pos;",
                "void main() {",
                "    gl_Position = u_viewProjMatrix * vec4( a_pos, 0.0, 1.0 );",
                "}"
            ].join("\n"),
            [
                "uniform vec4 u_color;",
                "void main() {",
                "    gl_FragColor = u_color;",
                "}"
            ].join("\n")
        );
        if (!this.texProgram || !this.colorProgram) {
            return;
        }

        this.texProgram.begin = function(viewProjMatrix) {
            var gl = this.gl;
            gl.useProgram(this.id);
            gl.uniformMatrix4fv(this.u_viewProjMatrix, false, viewProjMatrix.asArray());
            gl.enableVertexAttribArray(this.a_pos);
            gl.enableVertexAttribArray(this.a_tex0);
        };
        this.texProgram.end = function() {
            var gl = this.gl;
            gl.disableVertexAttribArray(this.a_tex0);
            gl.disableVertexAttribArray(this.a_pos);
            gl.useProgram(null);
        };

        this.colorProgram.begin = function(viewProjMatrix) {
            var gl = this.gl;
            gl.useProgram(this.id);
            gl.uniformMatrix4fv(this.u_viewProjMatrix, false, viewProjMatrix.asArray());
            gl.enableVertexAttribArray(this.a_pos);
        };
        this.colorProgram.end = function() {
            var gl = this.gl;
            gl.disableVertexAttribArray(this.a_pos);
            gl.useProgram(null);
        };

        this.posBuffer = gl.createBuffer();
        this.tex0Buffer = gl.createBuffer();

        this.gl = gl;

    } finally {
        con.endGroup();
    }
}
HNGLQuadDrawer.prototype.dispose = function() {
    var gl = this.gl;
    gl.deleteBuffer(this.tex0Buffer);
    this.tex0Buffer = null;
    gl.deleteBuffer(this.posBuffer);
    this.posBuffer = null;
    if (this.colorProgram) {
        this.colorProgram.dispose();
        this.colorProgram = null;
    }
    if (this.texProgram) {
        this.texProgram.dispose();
        this.texProgram = null;
    }
    this.gl = null;
}
HNGLQuadDrawer.prototype.beginBatch = function(viewportWidth, viewportHeight) {
    var gl = this.gl;
    gl.viewport(0, 0, viewportWidth, viewportHeight);
    this.viewProjMatrix = HNMatrix4x4.ortho(0, viewportWidth, viewportHeight, 0, 0, 1);
}
HNGLQuadDrawer.prototype.endBatch = function() {
}
HNGLQuadDrawer.prototype.draw = function(texture, sx, sy, sw, sh, flipY) {
    var gl = this.gl;

    // TODO: batching
    this.texProgram.begin(this.viewProjMatrix);
    gl.bindTexture(gl.TEXTURE_2D, texture);
    gl.uniform4f(this.texProgram.u_color, 1, 1, 1, 1);
    gl.uniform1i(this.texProgram.s_tex0, 0);
    var tv0 = flipY ? 1.0 : 0.0;
    var tv1 = flipY ? 0.0 : 1.0;
    var positions = [
        sx, sy,
        sx + sw, sy,
        sx, sy + sh,
        sx, sy + sh,
        sx + sw, sy,
        sx + sw, sy + sh,
    ];
    var tex0s = [
        0.0, tv0,
        1.0, tv0,
        0.0, tv1,
        0.0, tv1,
        1.0, tv0,
        1.0, tv1,
    ];
    gl.bindBuffer(gl.ARRAY_BUFFER, this.posBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, new WebGLFloatArray(positions), gl.STATIC_DRAW);
    gl.vertexAttribPointer(this.texProgram.a_pos, 2, gl.FLOAT, false, 0, 0);
    gl.bindBuffer(gl.ARRAY_BUFFER, this.tex0Buffer);
    gl.bufferData(gl.ARRAY_BUFFER, new WebGLFloatArray(tex0s), gl.STATIC_DRAW);
    gl.vertexAttribPointer(this.texProgram.a_tex0, 2, gl.FLOAT, false, 0, 0);
    gl.drawArrays(gl.TRIANGLES, 0, 6);
    gl.bindBuffer(gl.ARRAY_BUFFER, null);
    this.texProgram.end();
}
HNGLQuadDrawer.prototype.fill = function(r, g, b, a, sx, sy, sw, sh) {
    var gl = this.gl;

    // TODO: batching
    this.colorProgram.begin(this.viewProjMatrix);
    gl.uniform4f(this.colorProgram.u_color, r, g, b, a);
    var positions = [
        sx, sy,
        sx + sw, sy,
        sx, sy + sh,
        sx, sy + sh,
        sx + sw, sy,
        sx + sw, sy + sh,
    ];
    gl.bindBuffer(gl.ARRAY_BUFFER, this.posBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, new WebGLFloatArray(positions), gl.STATIC_DRAW);
    gl.vertexAttribPointer(this.colorProgram.a_pos, 2, gl.FLOAT, false, 0, 0);
    gl.drawArrays(gl.TRIANGLES, 0, 6);
    gl.bindBuffer(gl.ARRAY_BUFFER, null);
    this.colorProgram.end();
}
