var HNGLGrid = function (gl, blocks, spacing) {
    con.beginGroupCollapsed("HNGL - creating grid");
    try {
        this.program = HNGLProgram.fromSources(gl,
            [
                "uniform mat4 u_viewProjMatrix;",
                "uniform float u_scale;",
                "attribute vec3 a_pos;",
                "void main() {",
                "    gl_Position = u_viewProjMatrix * vec4( a_pos * u_scale, 1.0 );",
                "}"
            ].join("\n"),
            [
                "precision highp float;",
                "uniform vec4 u_color;",
                "void main() {",
                "    gl_FragColor = u_color;",
                "}"
            ].join("\n")
        );
        if (!this.program) {
            return;
        }

        var positions = [];
        {
            var blockCount = (blocks * 2 + 1) * (blocks * 2 + 1);
            var v = 0;
            var min = -blocks * spacing;
            var max = blocks * spacing;
            for (var n = -blocks; n <= blocks; n++, v += 4 * 3) {
                positions[v + 0 + 0] = n * spacing; positions[v + 0 + 2] = min;
                positions[v + 3 + 0] = n * spacing; positions[v + 3 + 2] = max;
                positions[v + 6 + 0] = min; positions[v + 6 + 2] = n * spacing;
                positions[v + 9 + 0] = max; positions[v + 9 + 2] = n * spacing;
                positions[v + 0 + 1] = positions[v + 3 + 1] = positions[v + 6 + 1] = positions[v + 9 + 1] = 0;
            }
            this.lineCount = (blocks * 2 + 1) * 4;
        }

        this.posBuffer = gl.createBuffer();
        gl.bindBuffer(gl.ARRAY_BUFFER, this.posBuffer);
        gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(positions), gl.STATIC_DRAW);
        gl.bindBuffer(gl.ARRAY_BUFFER, null);

        this.program.begin = function (viewProjMatrix, scale) {
            var gl = this.gl;
            gl.useProgram(this.id);
            gl.uniformMatrix4fv(this.u_viewProjMatrix, false, viewProjMatrix.asArray());
            gl.uniform1f(this.u_scale, scale);
            gl.uniform4f(this.u_color, 1.0, 1.0, 1.0, 1.0);
            gl.enableVertexAttribArray(this.a_pos);
        };
        this.program.end = function () {
            var gl = this.gl;
            gl.bindBuffer(gl.ARRAY_BUFFER, null);
            gl.disableVertexAttribArray(this.a_pos);
            gl.useProgram(null);
        };

        this.gl = gl;

    } finally {
        con.endGroup();
    }
}
HNGLGrid.prototype.dispose = function () {
    this.gl.deleteBuffer(this.posBuffer);
    this.posBuffer = null;
    if (this.program) {
        this.program.dispose();
        this.program = null;
    }
    this.gl = null;
}
HNGLGrid.prototype.draw = function (viewProjMatrix, scale) {
    var gl = this.gl;
    this.program.begin(viewProjMatrix, scale);

    gl.bindBuffer(gl.ARRAY_BUFFER, this.posBuffer);
    gl.vertexAttribPointer(this.program.a_pos, 3, gl.FLOAT, false, 0, 0);
    gl.drawArrays(gl.LINES, 0, this.lineCount);
    gl.bindBuffer(gl.ARRAY_BUFFER, null);

    this.program.end();
}