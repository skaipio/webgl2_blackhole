const flatten = (arr) => arr.reduce((a, b) => a.concat(b));
const red = [1, 0, 0, 1];
const green = [0, 1, 0, 1];
const white = [1, 1, 1, 1];

function Visualiser(renderWidth, renderHeight) {
  Utils.pimpFloatArray();
  this.particleCount = 100;
  this.newParticleCount = 100;
  this._renderWidth = renderWidth;
  this._renderHeight = renderHeight;
  this._currentParticleIndex = 0;
  this._speed = 0.01;
  this._centerVector = new THREE.Vector2(renderWidth / 2, renderHeight / 2);
  this._velocities = null;
  this._worker = new Worker('worker.js');
  this._workerAvailable = true;
}

Visualiser.prototype.createParticles = function() {
  var pMaterial = new THREE.PointsMaterial({
    color: 0xFFFFFF,
    size: 2
  });
  this._particleSystem = new THREE.Points(new THREE.BufferGeometry(), pMaterial);
  // create the particle variables
  var particles = this._particleSystem.geometry;
  var vertices = new Float32Array(this.particleCount * 3);
  var velocities = new Float32Array(this.particleCount * 2);
  vertices.fill(0);
  velocities.fill(0);
  var positionBuffer = new THREE.BufferAttribute(vertices, 3);
  particles.addAttribute('position', positionBuffer);
  this._velocities = velocities;

  // now create the individual particles
  for (var p = 0; p < this.particleCount; p++) {
    //this._createParticle(positionBuffer, velocities, p);
    this._resetParticle(p);
  }

  return this._particleSystem;
}

function getRandomPositionOnEdge(renderWidth, renderHeight) {
  var sides = Math.random() * (2 * renderWidth + 2 * renderHeight);
  var goesToSides = sides < 2 * renderHeight;
  // create a coordinate with random position values on edges
  var pX = goesToSides ? Utils.getRandomInt(0, 2) * renderWidth : Math.random() * renderHeight,
      pY = !goesToSides ? Utils.getRandomInt(0, 2) * renderHeight : Math.random() * renderWidth;

  return [pX, pY];
}

Visualiser.prototype._createParticle = function(positionBuffer, velocityArr, particleIndex) {
  var position = getRandomPositionOnEdge(this._renderWidth, this._renderHeight);
  positionBuffer.setXY(particleIndex, position[0], position[1]);

/*
  var velocity = new THREE.Vector2(0, 0);
  velocity.subVectors(this._centerVector, new THREE.Vector2(pX, pY));
  velocity.multiplyScalar(this._speed);
  velocityArr[particleIndex * 2] = velocity.x;
  velocityArr[particleIndex * 2 + 1] = velocity.y;*/
}

Visualiser.prototype.getVertexFromBuffer = function(buffer, index) {
  var start = index * 3; // vertex has 3 coordinates
  return [buffer[start], buffer[start + 1], buffer[start + 2]];
}

Visualiser.prototype.setVertexToBuffer = function(buffer, index, vertex) {
  var offset = index * 3; // vertex has 3 coordinates
  buffer.set(vertex, offset);
}

Visualiser.prototype.getPositionBuffer = function() {
  var particles = this._particleSystem.geometry;
  return particles.getAttribute('position');
}

function isCloseEnough(destination, pX, pY, vX, vY) {
  var currentDistance = Math.hypot(destination.x - pX, destination.y - pY);
  var velocityMagnitude = Math.hypot(vX, vY);
  return currentDistance <= velocityMagnitude;
}

function isNotStopped(pX, pY) {
  return !(pX === -1 && pY === -1);
}

Visualiser.prototype._setVelocity = function(index, vX, vY) {
  var velocities = this._velocities;
  velocities[index * 2] = vX;
  velocities[index * 2 + 1] = vY;
}

Visualiser.prototype._resetParticle = function(i) {
  var positionBuffer = this.getPositionBuffer();
  var velocities = this._velocities;
  var position = getRandomPositionOnEdge(this._renderWidth, this._renderHeight);
  positionBuffer.setXY(i, position[0], position[1]);
  //velocities[i * 2] = 0; velocities[i * 2 + 1] = 0;
  var scale = 1;
  var dragX = Utils.drag(position[0], 0, this._renderWidth);
  var dragY = Utils.drag(position[1], 0, this._renderHeight);
  var vX = -(2*dragX/this._renderHeight - 1); // go right if you're at bottom
  var vY = -(2*dragY/this._renderWidth - 1); // go down if you're at left
  this._setVelocity(i, vX * scale, vY * scale);
}

Visualiser.prototype.update = function() {
  this._checkParticleCountChanged();
  var particles = this._particleSystem.geometry;
  var positionBuffer = this.getPositionBuffer();
  var velocities = this._velocities;

  // now create the individual particles
  for (var i = 0; i < this.particleCount; ++i) {
    var pX = positionBuffer.getX(i), pY = positionBuffer.getY(i);
    var vX = velocities[i * 2], vY = velocities[i * 2 + 1];
    if (isCloseEnough(this._centerVector, pX, pY, vX, vY)) {
      this._resetParticle(i);
    } else if (isNotStopped(pX, pY)) {
      positionBuffer.setXY(i, pX + vX, pY + vY);
    }
    //console.log('velocity', vX, vY);
  }
  // flag to the particle system
  // that we've changed its vertices.
  positionBuffer.needsUpdate = true;
  this._updateVelocities();
}

Visualiser.prototype._checkParticleCountChanged = function() {
  if (this.newParticleCount === this.particleCount) return;
  var newParticleCount = this.newParticleCount;
  var newVertices = Float32Array.createDimensional(newParticleCount, 3);
  var positionBuffer = this.getPositionBuffer();

  for (var i = 0; i < this.particleCount; ++i) {
    var offset = i * 3;
    newVertices[offset] = positionBuffer.getX(i);
    newVertices[offset+1] = positionBuffer.getY(i);
    newVertices[offset+2] = positionBuffer.getZ(i);
  }

  positionBuffer.setArray(newVertices);

  var newVelocities = [];
  var oldVelocities = this._velocities;
  for (var i = 0; i < newParticleCount; ++i) {
    var offset = i * 2;
    if (this.particleCount < newParticleCount) {
      newVelocities.push(oldVelocities[offset]);
      newVelocities.push(oldVelocities[offset+1]);
    } else {
      newVelocities.push(0);
      newVelocities.push(0);
      //newVelocities[offset] = newVelocities[offset+1] = 0;
    }
  }

  this._velocities = newVelocities;

  for (var i = this.particleCount; i < newParticleCount; ++i) {
    this._resetParticle(i);
  }

  this.particleCount = newParticleCount;
}

Visualiser.prototype._updateVelocities = function() {
  if (this._workerAvailable) {
    var selfObj = this;
    this._workerAvailable = false;
    var worker = this._worker;

    var msg = {
      blackHolePosition: {x: this._centerVector.x, y: this._centerVector.y},
      positions: this.getPositionBuffer().array,
      velocities: this._velocities
    }

    worker.postMessage(msg);

    worker.onmessage = function(e) {
      selfObj._workerAvailable = true;
      selfObj._velocities = e.data.velocities;
    }
  }
}
