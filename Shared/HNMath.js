var HNVector3 = function(x, y, z) {
    this.x = x;
    this.y = y;
    this.z = z;
}
HNVector3.prototype.clone = function() {
    return new HNVector3(this.x, this.y, this.z);
}
HNVector3.prototype.asArray = function() {
    return [this.x, this.y, this.z];
}
HNVector3.prototype.length = function() {
    return Math.sqrt(this.x * this.x + this.y * this.y + this.z * this.z);
}
HNVector3.prototype.lengthSquared = function() {
    return this.x * this.x + this.y * this.y + this.z * this.z;
}
HNVector3.prototype.distanceTo = function(other) {
    var dx = other.x - this.x;
    var dy = other.y - this.y;
    var dz = other.z - this.z;
    return Math.sqrt(dx * dx + dy * dy + dz * dz);
}
HNVector3.prototype.distanceSquaredTo = function(other) {
    var dx = other.x - this.x;
    var dy = other.y - this.y;
    var dz = other.z - this.z;
    return dx * dx + dy * dy + dz * dz;
}
HNVector3.prototype.dot = function(other) {
    return this.x * other.x + this.y * other.y + this.z * other.z;
}
HNVector3.prototype.cross = function(other) {
    return new HNVector3(
        this.y * other.z - this.z * other.y,
        this.z * other.x - this.x * other.z,
        this.x * other.y - this.y * other.x
    );
}
HNVector3.prototype.negate = function() {
    this.x *= -1.0;
    this.y *= -1.0;
    this.z *= -1.0;
}
HNVector3.prototype.normalize = function() {
    var lengthSquared = this.x * this.x + this.y * this.y + this.z * this.z;
    if (lengthSquared == 0.0)
        return;
    var invSqrt = 1.0 / Math.sqrt(lengthSquared);
    this.x *= invSqrt;
    this.y *= invSqrt;
    this.z *= invSqrt;
}
HNVector3.prototype.add = function(other) {
    return new HNVector3(
        this.x + other.x,
        this.y + other.y,
        this.z + other.z
    );
}
HNVector3.prototype.addTo = function(other) {
    this.x += other.x;
    this.y += other.y;
    this.z += other.z;
}
HNVector3.prototype.subtract = function(other) {
    return new HNVector3(
        this.x - other.x,
        this.y - other.y,
        this.z - other.z
    );
}
HNVector3.prototype.subtractFrom = function(other) {
    this.x -= other.x;
    this.y -= other.y;
    this.z -= other.z;
}
HNVector3.prototype.multiplyScalar = function(scalar) {
    this.x *= scalar;
    this.y *= scalar;
    this.z *= scalar;
}
HNVector3.lerp = function(v0, v1, alpha) {
    return new HNVector3(
        v0.x + alpha * (v1.x - v0.x),
        v0.y + alpha * (v1.y - v0.y),
        v0.z + alpha * (v1.z - v0.z)
    );
}

var HNVector4 = function(x, y, z, w) {
    this.x = x;
    this.y = y;
    this.z = z;
    this.w = w;
}
HNVector4.prototype.clone = function() {
    return new HNVector4(this.x, this.y, this.z, this.w);
}
HNVector4.prototype.asArray = function() {
    return [this.x, this.y, this.z, this.w];
}
HNVector4.prototype.normalize = function() {
    var lengthSquared = this.x * this.x + this.y * this.y + this.z * this.z + this.w * this.w;
    if (lengthSquared == 0.0)
        return;
    var invSqrt = 1.0 / Math.sqrt(lengthSquared);
    this.x *= invSqrt;
    this.y *= invSqrt;
    this.z *= invSqrt;
    this.w *= invSqrt;
}
HNVector4.prototype.add = function(other) {
    return new HNVector4(
        this.x + other.x,
        this.y + other.y,
        this.z + other.z,
        this.w + other.w
    );
}
HNVector4.prototype.addTo = function(other) {
    this.x += other.x;
    this.y += other.y;
    this.z += other.z;
    this.w += other.w;
}
HNVector4.prototype.subtract = function(other) {
    return new HNVector4(
        this.x - other.x,
        this.y - other.y,
        this.z - other.z,
        this.w - other.w
    );
}
HNVector4.prototype.subtractFrom = function(other) {
    this.x -= other.x;
    this.y -= other.y;
    this.z -= other.z;
    this.w -= other.w;
}
HNVector4.prototype.multiplyScalar = function(scalar) {
    this.x *= scalar;
    this.y *= scalar;
    this.z *= scalar;
    this.w *= scalar;
}
HNVector4.lerp = function(v0, v1, alpha) {
    return new HNVector4(
        v0.x + alpha * (v1.x - v0.x),
        v0.y + alpha * (v1.y - v0.y),
        v0.z + alpha * (v1.z - v0.z),
        v0.w + alpha * (v1.w - v0.w)
    );
}

var HNQuaternion = function(x, y, z, w) {
    this.x = x;
    this.y = y;
    this.z = z;
    this.w = w;
}
HNQuaternion.prototype.clone = function() {
    return new HNQuaternion(this.x, this.y, this.z, this.w);
}
HNQuaternion.fromYawPitchRoll = function(yaw, pitch, roll) {
    var syaw = Math.sin(yaw / 2.0);
    var cyaw = Math.cos(yaw / 2.0);
    var spitch = Math.sin(pitch / 2.0);
    var cpitch = Math.cos(pitch / 2.0);
    var sroll = Math.sin(roll / 2.0);
    var croll = Math.cos(roll / 2.0);
    return new HNQuaternion(
        (cyaw * spitch) * croll + (syaw * cpitch) * sroll,
        (syaw * cpitch) * croll - (cyaw * spitch) * sroll,
        (cyaw * cpitch) * sroll - (syaw * spitch) * croll,
        (cyaw * cpitch) * croll + (syaw * spitch) * sroll
    );
}
HNQuaternion.prototype.asArray = function() {
    return [this.x, this.y, this.z, this.w];
}
HNQuaternion.prototype.length = function() {
    return Math.sqrt(this.x * this.x + this.y * this.y + this.z * this.z + this.w * this.w);
}
HNQuaternion.prototype.lengthSquared = function() {
    return this.x * this.x + this.y * this.y + this.z * this.z + this.w * this.w;
}
HNQuaternion.prototype.transformVec3 = function(v) {
    var xxx = this.x * (this.x + this.x);
    var wxx = this.w * (this.x + this.x);
    var xyy = this.x * (this.y + this.y);
    var yyy = this.y * (this.y + this.y);
    var wyy = this.w * (this.y + this.y);
    var xzz = this.x * (this.z + this.z);
    var yzz = this.y * (this.z + this.z);
    var zzz = this.z * (this.z + this.z);
    var wzz = this.w * (this.z + this.z);
    return new HNVector3(
        ((v.x * ((1.0 - yyy) - zzz)) + (v.y * (xyy - wzz))) + (v.z * (xzz + wyy)),
        ((v.x * (xyy + wzz)) + (v.y * ((1.0 - xxx) - zzz))) + (v.z * (yzz - wxx)),
        ((v.x * (xzz - wyy)) + (v.y * (yzz + wxx))) + (v.z * ((1.0 - xxx) - yyy))
    );
}

/*
11, 12, 13, 14,    sx,  0,  0,  0,
21, 22, 23, 24,     0, sy,  0,  0,
31, 32, 33, 34,     0,  0, sz,  0,
41, 42, 43, 44     tx, ty, tz,  1
0,  1,  2,  3,
4,  5,  6,  7,
8,  9, 10, 11,
12, 13, 14, 15
*/
var HNMatrix4x4 = function(m11, m12, m13, m14, m21, m22, m23, m24, m31, m32, m33, m34, m41, m42, m43, m44) {
    if (WebGLFloatArray) {
        // If we are in a browser that supports WebGL, use a WebGLFloatArray as our storage
        // This makes passing matrices to gl faster
        if (!m11) {
            this.el = new WebGLFloatArray([
                0, 0, 0, 0,
                0, 0, 0, 0,
                0, 0, 0, 0,
                0, 0, 0, 0
            ]);
        } else if (typeOf(m11) == 'array') {
            this.el = new WebGLFloatArray(m11);
        } else {
            this.el = new WebGLFloatArray([
                m11, m12, m13, m14,
                m21, m22, m23, m24,
                m31, m32, m33, m34,
                m41, m42, m43, m44
            ]);
        }
    } else {
        if (!m11) {
            this.el = [
                0, 0, 0, 0,
                0, 0, 0, 0,
                0, 0, 0, 0,
                0, 0, 0, 0
            ];
        } else if (typeOf(m11) == 'array') {
            this.el = m11;
        } else {
            this.el = [
                m11, m12, m13, m14,
                m21, m22, m23, m24,
                m31, m32, m33, m34,
                m41, m42, m43, m44
            ];
        }
    }
}
HNMatrix4x4.prototype.clone = function() {
    return new HNMatrix4x4(
        this.el[0], this.el[1], this.el[2], this.el[3],
        this.el[4], this.el[5], this.el[6], this.el[7],
        this.el[8], this.el[9], this.el[10], this.el[11],
        this.el[12], this.el[13], this.el[14], this.el[15]
    );
}
HNMatrix4x4.I = function() {
    return new HNMatrix4x4([
        1, 0, 0, 0,
        0, 1, 0, 0,
        0, 0, 1, 0,
        0, 0, 0, 1
    ]);
}
HNMatrix4x4.T = function(tx, ty, tz) {
    return new HNMatrix4x4([
        1, 0, 0, 0,
        0, 1, 0, 0,
        0, 0, 1, 0,
        tx, ty, tz, 1
    ]);
}
HNMatrix4x4.S = function(sx, sy, sz) {
    return new HNMatrix4x4([
        sx, 0, 0, 0,
        0, sy, 0, 0,
        0, 0, sz, 0,
        0, 0, 0, 1
    ]);
}
HNMatrix4x4.ortho = function(left, right, bottom, top, znear, zfar) {
    var x = 2 / (right - left);
    var y = 2 / (top - bottom);
    var z = 2 / (zfar - znear);
    var tx = (right + left) / (right - left);
    var ty = (top + bottom) / (top - bottom);
    var tz = (zfar + znear) / (zfar - znear);
    return new HNMatrix4x4(
        x, 0, 0, 0,
        0, y, 0, 0,
        0, 0, -z, 0,
        -tx, -ty, -tz, 1
    );
}
HNMatrix4x4.perspective = function(fovy, aspect, znear, zfar) {
    var sy = 1.0 / Math.tan(fovy / 2.0);
    var sx = sy / aspect;
    return new HNMatrix4x4(
        sx, 0, 0, 0,
        0, sy, 0, 0,
        0, 0, zfar / (znear - zfar), -1,
        0, 0, (znear * zfar) / (znear - zfar), 0
    );
}
HNMatrix4x4.prototype.asArray = function() {
    return this.el;
}
HNMatrix4x4.prototype.isIdentity = function() {
    return (
        (this.el[0] == 1) && (this.el[5] == 1) && (this.el[10] == 1) && (this.el[15] == 1) &&
        (this.el[1] == 0) && (this.el[2] == 0) && (this.el[3] == 0) &&
        (this.el[4] == 0) && (this.el[6] == 0) && (this.el[7] == 0) &&
        (this.el[8] == 0) && (this.el[9] == 0) && (this.el[11] == 0) &&
        (this.el[12] == 0) && (this.el[13] == 0) && (this.el[14] == 0)
    );
}
HNMatrix4x4.prototype.isAffine = function() {
    return (
        (this.el[3] == 0) && (this.el[7] == 0) && (this.el[11] == 0) && (this.el[15] == 1)
    );
}
HNMatrix4x4.prototype.multiply = function(other) {
    return new HNMatrix4x4(
        this.el[0] * other.el[0] + this.el[1] * other.el[4] + this.el[2] * other.el[8] + this.el[3] * other.el[12],
        this.el[0] * other.el[1] + this.el[1] * other.el[5] + this.el[2] * other.el[9] + this.el[3] * other.el[13],
        this.el[0] * other.el[2] + this.el[1] * other.el[6] + this.el[2] * other.el[10] + this.el[3] * other.el[14],
        this.el[0] * other.el[3] + this.el[1] * other.el[7] + this.el[2] * other.el[11] + this.el[3] * other.el[15],
        this.el[4] * other.el[0] + this.el[5] * other.el[4] + this.el[6] * other.el[8] + this.el[7] * other.el[12],
        this.el[4] * other.el[1] + this.el[5] * other.el[5] + this.el[6] * other.el[9] + this.el[7] * other.el[13],
        this.el[4] * other.el[2] + this.el[5] * other.el[6] + this.el[6] * other.el[10] + this.el[7] * other.el[14],
        this.el[4] * other.el[3] + this.el[5] * other.el[7] + this.el[6] * other.el[11] + this.el[7] * other.el[15],
        this.el[8] * other.el[0] + this.el[9] * other.el[4] + this.el[10] * other.el[8] + this.el[11] * other.el[12],
        this.el[8] * other.el[1] + this.el[9] * other.el[5] + this.el[10] * other.el[9] + this.el[11] * other.el[13],
        this.el[8] * other.el[2] + this.el[9] * other.el[6] + this.el[10] * other.el[10] + this.el[11] * other.el[14],
        this.el[8] * other.el[3] + this.el[9] * other.el[7] + this.el[10] * other.el[11] + this.el[11] * other.el[15],
        this.el[12] * other.el[0] + this.el[13] * other.el[4] + this.el[14] * other.el[8] + this.el[15] * other.el[12],
        this.el[12] * other.el[1] + this.el[13] * other.el[5] + this.el[14] * other.el[9] + this.el[15] * other.el[13],
        this.el[12] * other.el[2] + this.el[13] * other.el[6] + this.el[14] * other.el[10] + this.el[15] * other.el[14],
        this.el[12] * other.el[3] + this.el[13] * other.el[7] + this.el[14] * other.el[11] + this.el[15] * other.el[15]
    );
    return this;
}
HNMatrix4x4.prototype.multiplyBy = function(other) {
    var newEl = [
        this.el[0] * other.el[0] + this.el[1] * other.el[4] + this.el[2] * other.el[8] + this.el[3] * other.el[12],
        this.el[0] * other.el[1] + this.el[1] * other.el[5] + this.el[2] * other.el[9] + this.el[3] * other.el[13],
        this.el[0] * other.el[2] + this.el[1] * other.el[6] + this.el[2] * other.el[10] + this.el[3] * other.el[14],
        this.el[0] * other.el[3] + this.el[1] * other.el[7] + this.el[2] * other.el[11] + this.el[3] * other.el[15],
        this.el[4] * other.el[0] + this.el[5] * other.el[4] + this.el[6] * other.el[8] + this.el[7] * other.el[12],
        this.el[4] * other.el[1] + this.el[5] * other.el[5] + this.el[6] * other.el[9] + this.el[7] * other.el[13],
        this.el[4] * other.el[2] + this.el[5] * other.el[6] + this.el[6] * other.el[10] + this.el[7] * other.el[14],
        this.el[4] * other.el[3] + this.el[5] * other.el[7] + this.el[6] * other.el[11] + this.el[7] * other.el[15],
        this.el[8] * other.el[0] + this.el[9] * other.el[4] + this.el[10] * other.el[8] + this.el[11] * other.el[12],
        this.el[8] * other.el[1] + this.el[9] * other.el[5] + this.el[10] * other.el[9] + this.el[11] * other.el[13],
        this.el[8] * other.el[2] + this.el[9] * other.el[6] + this.el[10] * other.el[10] + this.el[11] * other.el[14],
        this.el[8] * other.el[3] + this.el[9] * other.el[7] + this.el[10] * other.el[11] + this.el[11] * other.el[15],
        this.el[12] * other.el[0] + this.el[13] * other.el[4] + this.el[14] * other.el[8] + this.el[15] * other.el[12],
        this.el[12] * other.el[1] + this.el[13] * other.el[5] + this.el[14] * other.el[9] + this.el[15] * other.el[13],
        this.el[12] * other.el[2] + this.el[13] * other.el[6] + this.el[14] * other.el[10] + this.el[15] * other.el[14],
        this.el[12] * other.el[3] + this.el[13] * other.el[7] + this.el[14] * other.el[11] + this.el[15] * other.el[15]
    ];
    if (WebGLFloatArray) {
        this.el = new WebGLFloatArray(newEl);
    } else {
        this.el = newEl;
    }
    return this;
}
HNMatrix4x4.prototype.multiplyVec3 = function(v) {
    return new HNVector3(
        v.x * this.el[0] + v.y * this.el[4] + v.z * this.el[8] + this.el[12],
        v.x * this.el[1] + v.y * this.el[5] + v.z * this.el[9] + this.el[13],
        v.x * this.el[2] + v.y * this.el[6] + v.z * this.el[10] + this.el[14]
    );
}
HNMatrix4x4.prototype.multiplyVec4 = function(v) {
    return new HNVector4(
        v.x * this.el[0] + v.y * this.el[4] + v.z * this.el[8] + v.w * this.el[12],
        v.x * this.el[1] + v.y * this.el[5] + v.z * this.el[9] + v.w * this.el[13],
        v.x * this.el[2] + v.y * this.el[6] + v.z * this.el[10] + v.w * this.el[14],
        v.x * this.el[3] + v.y * this.el[7] + v.z * this.el[11] + v.w * this.el[15]
    );
}
HNMatrix4x4.prototype.getDeterminant = function() {
    var t00 = this.el[10] * this.el[15] - this.el[11] * this.el[14];
    var t01 = this.el[9] * this.el[15] - this.el[11] * this.el[13];
    var t02 = this.el[8] * this.el[15] - this.el[11] * this.el[12];
    var t03 = this.el[9] * this.el[14] - this.el[10] * this.el[13];
    var t04 = this.el[8] * this.el[14] - this.el[10] * this.el[12];
    var t05 = this.el[8] * this.el[13] - this.el[9] * this.el[12];
    return this.el[0] * (this.el[5] * t00 - this.el[6] * t01 + this.el[7] * t03) -
        this.el[1] * (this.el[4] * t00 - this.el[6] * t02 + this.el[7] * t04) +
        this.el[2] * (this.el[4] * t01 - this.el[5] * t02 + this.el[7] * t05) -
        this.el[3] * (this.el[4] * t03 - this.el[5] * t04 + this.el[6] * t05);
}
HNMatrix4x4.prototype.invert = function() {
    var t00 = this.el[10] * this.el[15] - this.el[11] * this.el[14];
    var t01 = this.el[9] * this.el[15] - this.el[11] * this.el[13];
    var t02 = this.el[8] * this.el[15] - this.el[11] * this.el[12];
    var t03 = this.el[9] * this.el[14] - this.el[10] * this.el[13];
    var t04 = this.el[8] * this.el[14] - this.el[10] * this.el[12];
    var t05 = this.el[8] * this.el[13] - this.el[9] * this.el[12];
    var determinant = this.el[0] * (this.el[5] * t00 - this.el[6] * t01 + this.el[7] * t03) -
        this.el[1] * (this.el[4] * t00 - this.el[6] * t02 + this.el[7] * t04) +
        this.el[2] * (this.el[4] * t01 - this.el[5] * t02 + this.el[7] * t05) -
        this.el[3] * (this.el[4] * t03 - this.el[5] * t04 + this.el[6] * t05);
    if (determinant == 0) {
        return;
    }
    var t06 = this.el[10] * this.el[15] - this.el[11] * this.el[14];
    var t07 = this.el[9] * this.el[15] - this.el[11] * this.el[13];
    var t08 = this.el[8] * this.el[15] - this.el[11] * this.el[12];
    var t09 = this.el[9] * this.el[14] - this.el[10] * this.el[13];
    var t10 = this.el[8] * this.el[14] - this.el[10] * this.el[12];
    var t11 = this.el[8] * this.el[13] - this.el[9] * this.el[12];
    var t12 = this.el[6] * this.el[15] - this.el[7] * this.el[14];
    var t13 = this.el[5] * this.el[15] - this.el[7] * this.el[13];
    var t14 = this.el[4] * this.el[15] - this.el[7] * this.el[12];
    var t15 = this.el[5] * this.el[14] - this.el[6] * this.el[13];
    var t16 = this.el[4] * this.el[14] - this.el[6] * this.el[12];
    var t17 = this.el[4] * this.el[13] - this.el[5] * this.el[12];
    var t18 = this.el[6] * this.el[11] - this.el[7] * this.el[10];
    var t19 = this.el[5] * this.el[11] - this.el[7] * this.el[9];
    var t20 = this.el[4] * this.el[11] - this.el[7] * this.el[8];
    var t21 = this.el[5] * this.el[10] - this.el[6] * this.el[9];
    var t22 = this.el[4] * this.el[10] - this.el[6] * this.el[8];
    var t23 = this.el[4] * this.el[9] - this.el[5] * this.el[8];
    var inverseDet = 1.0 / determinant;
    var newEl = [
         (this.el[5] * t00 - this.el[6] * t01 + this.el[7] * t03) * inverseDet,
        -(this.el[1] * t06 - this.el[2] * t07 + this.el[3] * t09) * inverseDet,
         (this.el[1] * t12 - this.el[2] * t13 + this.el[3] * t15) * inverseDet,
        -(this.el[1] * t18 - this.el[2] * t19 + this.el[3] * t21) * inverseDet,
        -(this.el[4] * t00 - this.el[6] * t02 + this.el[7] * t04) * inverseDet,
         (this.el[0] * t06 - this.el[2] * t08 + this.el[3] * t10) * inverseDet,
        -(this.el[0] * t12 - this.el[2] * t14 + this.el[3] * t16) * inverseDet,
         (this.el[0] * t18 - this.el[2] * t20 + this.el[3] * t22) * inverseDet,
         (this.el[4] * t01 - this.el[5] * t02 + this.el[7] * t05) * inverseDet,
        -(this.el[0] * t07 - this.el[1] * t08 + this.el[3] * t11) * inverseDet,
         (this.el[0] * t13 - this.el[1] * t14 + this.el[3] * t17) * inverseDet,
        -(this.el[0] * t19 - this.el[1] * t20 + this.el[3] * t23) * inverseDet,
        -(this.el[4] * t03 - this.el[5] * t04 + this.el[6] * t05) * inverseDet,
         (this.el[0] * t09 - this.el[1] * t10 + this.el[2] * t11) * inverseDet,
        -(this.el[0] * t15 - this.el[1] * t16 + this.el[2] * t17) * inverseDet,
         (this.el[0] * t21 - this.el[1] * t22 + this.el[2] * t23) * inverseDet
    ];
    if (WebGLFloatArray) {
        this.el = new WebGLFloatArray(newEl);
    } else {
        this.el = newEl;
    }
    return this;
}
HNMatrix4x4.prototype.transpose = function() {
    Array.swap(this.el, 1, 4);
    Array.swap(this.el, 2, 8);
    Array.swap(this.el, 3, 12);
    Array.swap(this.el, 6, 9);
    Array.swap(this.el, 7, 13);
    Array.swap(this.el, 11, 14);
    return this;
}
HNMatrix4x4.prototype.translate = function(tx, ty, tz) {
    this.el[0] += this.el[3] * tx;
    this.el[1] += this.el[3] * ty;
    this.el[2] += this.el[3] * tz;
    this.el[4] += this.el[7] * tx;
    this.el[5] += this.el[7] * ty;
    this.el[6] += this.el[7] * tz;
    this.el[8] += this.el[11] * tx;
    this.el[9] += this.el[11] * ty;
    this.el[10] += this.el[11] * tz;
    this.el[12] += this.el[15] * tx;
    this.el[13] += this.el[15] * ty;
    this.el[14] += this.el[15] * tz;
    return this;
}
HNMatrix4x4.prototype.scale = function(sx, sy, sz) {
    this.el[0] *= sx;
    this.el[1] *= sy;
    this.el[2] *= sz;
    this.el[4] *= sx;
    this.el[5] *= sy;
    this.el[6] *= sz;
    this.el[8] *= sx;
    this.el[9] *= sy;
    this.el[10] *= sz;
    this.el[12] *= sx;
    this.el[13] *= sy;
    this.el[14] *= sz;
    return this;
}
HNMatrix4x4.prototype.rotateX = function(rads) {
    var m = new HNMatrix4x4(
        1, 0, 0, 0,
        0, Math.cos(rads), -Math.sin(rads), 0,
        0, Math.sin(rads), Math.cos(rads), 0,
        0, 0, 0, 1
    );
    this.multiplyBy(m);
    return this;
}
HNMatrix4x4.prototype.rotateY = function(rads) {
    var m = new HNMatrix4x4(
        Math.cos(rads), 0, Math.sin(rads), 0,
        0, 1, 0, 0,
        -Math.sin(rads), 0, Math.cos(rads), 0,
        0, 0, 0, 1
    );
    this.multiplyBy(m);
    return this;
}
HNMatrix4x4.prototype.rotateZ = function(rads) {
    var m = new HNMatrix4x4(
        Math.cos(rads), -Math.sin(rads), 0, 0,
        Math.sin(rads), Math.cos(rads), 0, 0,
        0, 0, 1, 0,
        0, 0, 0, 1
    );
    this.multiplyBy(m);
    return this;
}

var HNMatrixStack4x4 = function() {
    this.stack = [];
    this.current = HNMatrix4x4.I();
}
HNMatrixStack4x4.prototype.asArray = function() {
    return this.current.asArray();
}
HNMatrixStack4x4.prototype.push = function(m) {
    if (m) {
        this.stack.push(this.current.clone());
        this.current = m.clone();
    } else {
        this.stack.push(this.current.clone());
    }
}
HNMatrixStack4x4.prototype.pop = function() {
    if (this.stack.length == 0) {
        throw "matrix stack underflow";
    }
    this.current = this.stack.pop();
    return this.current;
}
HNMatrixStack4x4.prototype.load = function(m) {
    this.current = m.clone();
}
HNMatrixStack4x4.prototype.loadIdentity = function() {
    this.current = HNMatrix4x4.I();
}
HNMatrixStack4x4.prototype.multiplyBy = function(m) {
    this.current.multiplyBy(m);
    return this.current;
}
HNMatrixStack4x4.prototype.translate = function(tx, ty, tz) {
    this.current.translate(tx, ty, tz);
    return this.current;
}
HNMatrixStack4x4.prototype.scale = function(sx, sy, sz) {
    var m = HNMatrix4x4.S(sx, sy, sz);
    this.current.multiplyBy(m);
    //this.current.scale(sx, sy, sz);
    return this.current;
}
HNMatrixStack4x4.prototype.rotateX = function(rads) {
    this.current.rotateX(rads);
    return this.current;
}
HNMatrixStack4x4.prototype.rotateY = function(rads) {
    this.current.rotateY(rads);
    return this.current;
}
HNMatrixStack4x4.prototype.rotateZ = function(rads) {
    this.current.rotateZ(rads);
    return this.current;
}
HNMatrixStack4x4.prototype.invert = function() {
    this.current.invert();
    return this.current;
}
