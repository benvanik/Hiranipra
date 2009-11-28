var HNFPSCamera = function() {
    this.position = new HNVector3(0, 0, 0);
    this.yaw = this.pitch = this.roll = 0;
    this.znear = 0.1;
    this.zfar = 100.0;
    this.fov = Math.PI / 2.0;

    this.dposition = new HNVector3(0, 0, 0);
    this.dyaw = this.dpitch = this.droll = 0;
    this.dfov = 0.0;
    this.isDirty = false;
}
HNFPSCamera.prototype.resize = function(width, height) {
    this.viewportWidth = width;
    this.viewportHeight = height;
    this.isDirty = true;
}
HNFPSCamera.prototype.update = function(delta) {
    if (this.isDirty == false) {
        return false;
    }

    this.yaw += this.dyaw * delta * Math.PI;
    this.pitch += this.dpitch * delta * Math.PI;
    this.roll += this.droll * delta * Math.PI;

    var q = HNQuaternion.fromYawPitchRoll(this.yaw, this.pitch, this.roll);
    var dpos = q.transformVec3(this.dposition);
    this.position.addTo(dpos);

    this.projMatrix = HNMatrix4x4.perspective(
        this.fov,
        (this.viewportWidth / this.viewportHeight),
        this.znear, this.zfar
    );
    var m = HNMatrix4x4.T(this.position.x, this.position.y, this.position.z);
    m.rotateY(this.yaw);
    m.rotateX(this.pitch);
    m.rotateZ(this.roll);
    this.viewMatrix = m;

//    var tfov = this.fov;
//    if (this.dfov > 0) {
//        tfov *= 2.0 * delta;
//    } else {
//        tfov /= 2.0 * delta;
//    }
//    this.fov = Math.clamp(tfov, 0.0, Math.PI / 2.0);

    this.dposition = new HNVector3(0, 0, 0);
    this.dyaw = this.dpitch = this.droll = 0;
    this.dfov = 0;
    this.isDirty = false;
    return true;
}
HNFPSCamera.prototype.setPositionImpulse = function(dx, dy, dz) {
    this.dposition = new HNVector3(dx, dy, dz);
    this.isDirty = true;
}
HNFPSCamera.prototype.setYawPitchRollImpulse = function(dyaw, dpitch, droll) {
    this.dyaw = dyaw;
    this.dpitch = dpitch;
    this.droll = droll;
    this.isDirty = true;
}
HNFPSCamera.prototype.setFovImpulse = function(dfov) {
    this.dfov = dfov;
    this.isDirty = true;
}
HNFPSCamera.prototype.updateInput = function(delta, keyboard) {
    var dx = 0;
    var dy = 0;
    var dz = 0;
    var dyaw = 0;
    var dpitch = 0;
    var droll = 0;
    var dfov = 0;
    if (keyboard.isDown(87) || keyboard.isDown(119)) { // w
        dz += 1;
    }
    if (keyboard.isDown(83) || keyboard.isDown(115)) { // s
        dz -= 1;
    }
    if (keyboard.isDown(65) || keyboard.isDown(97)) { // a
        dx += 1;
    }
    if (keyboard.isDown(68) || keyboard.isDown(100)) { // d
        dx -= 1;
    }
    if (keyboard.isDown(81) || keyboard.isDown(113)) { // q
        dy -= 1;
    }
    if (keyboard.isDown(90) || keyboard.isDown(112)) { // z
        dy += 1;
    }
    if (keyboard.isDown(37)) { // left arrow
        dyaw += 1;
    }
    if (keyboard.isDown(39)) { // right arrow
        dyaw -= 1;
    }
    if (keyboard.isDown(38)) { // up arrow
        dpitch += 1;
    }
    if (keyboard.isDown(40)) { // down arrow
        dpitch -= 1;
    }
    if (keyboard.isDown(219)) { // [
        dfov += 1;
    }
    if (keyboard.isDown(221)) { // ]
        dfov -= 1;
    }
    if (dx || dy || dz) {
        this.setPositionImpulse(dx, dy, dz);
    }
    if (dyaw || dpitch || droll) {
        this.setYawPitchRollImpulse(dyaw, dpitch, droll);
    }
    if (dfov) {
        this.setFovImpulse(dfov);
    }
}
