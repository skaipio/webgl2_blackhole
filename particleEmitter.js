const MAX_PARTICLE_COUNT = 1000000;

var ParticleEmitter = (function() {

  function ParticleGeometry(initialValues) {
    const properties = this._properties = {
      initialSpeed: initialValues.speed,
      currentParticleCount: initialValues.particleCount,
      sourceIndex: 0,
      geometries: []
    };
    var material;
    var positionData, velocityData;

    init(this);

    function init(o) {
      properties.material = new THREE.ShaderMaterial({
        uniforms: {
          pointSize: { type: "f", value: initialValues.particleSize }
        },
        vertexShader: document.getElementById( 'vs-particles-2' ).textContent,
        fragmentShader: document.getElementById( 'fs-particles-2' ).textContent,
        blending: THREE.AdditiveBlending,
        depthWrite: false,
        depthTest: true,
        transparent: true
      });
      var geometry = o._createGeometry();
      properties.geometries.push(geometry);
      properties.geometries.push(geometry.clone());
      properties.mesh = new THREE.Points( geometry, properties.material );
    }
  }

  ParticleGeometry.prototype._createGeometry = function() {
    var properties = this._properties;
    Utils.pimpFloatArray();
    var geometry = new THREE.BufferGeometry();
    var positionData = Float32Array.createDimensional(MAX_PARTICLE_COUNT, 4);
    var velocityData = Float32Array.createDimensional(MAX_PARTICLE_COUNT, 4);
    // TODO: Emit particles from edges?
    /*
    var size = renderer.getSize();
    var width = size.width - 10;
    var height = size.height - 10;
    */
    this._generateParticles(positionData, velocityData, 0, properties.currentParticleCount);
    geometry.setDrawRange(0, properties.currentParticleCount * 4);
    geometry.addAttribute( 'position', new THREE.BufferAttribute( positionData, 4 ).setDynamic(true) );
    geometry.addAttribute( 'velocity', new THREE.BufferAttribute( velocityData, 4 ).setDynamic(true) );
    return geometry;
  }

  ParticleGeometry.prototype._generateParticles = function(
    targetPosArray,
    targetVelArray,
    startIndex,
    endIndex) {
    var properties = this._properties;
    for ( var i = startIndex; i <= endIndex; i+=4 ) {
      var position = Utils.getRandomPositionOnCircle(1);
      position.multiplyScalar(THREE.Math.randFloat(20, 100));
      // positions
      var x = position.x;
      var y = position.y;
      var z = 0;
      targetPosArray[ i ]     = x;
      targetPosArray[ i + 1 ] = y;
      targetPosArray[ i + 2 ] = z;
      targetPosArray[ i + 3 ] = 0.0;
      var euler = new THREE.Euler(0, 0, Math.PI/2, 'XYZ');
      position.applyEuler(euler);
      position.normalize();
      position.multiplyScalar(properties.initialSpeed);
      targetVelArray[ i ] = position.x;
      targetVelArray[ i + 1 ] = position.y;
      targetVelArray[ i + 2 ] = 0.0;
      targetVelArray[ i + 3 ] = 0.0;
    }
  }

  ParticleGeometry.prototype.getParticleMesh = function() {
    return this._properties.mesh;
  }

  ParticleGeometry.prototype.getSourceGeometry = function() {
    var properties = this._properties;
    return properties.geometries[properties.sourceIndex];
  }

  ParticleGeometry.prototype.getTargetGeometry = function() {
    var properties = this._properties;
    return properties.geometries[(properties.sourceIndex + 1) % 2];
  }

  ParticleGeometry.prototype.incrementSourceIndex = function() {
    var properties = this._properties;
    properties.sourceIndex = (properties.sourceIndex + 1) % 2;
  }

  ParticleGeometry.prototype._resizeDataForGeometry = function(geometry, newParticleCount) {
    var properties = this._properties;
    var posAttr = geometry.getAttribute('position');
    var velAttr = geometry.getAttribute('velocity');
    var positionData = posAttr.array;
    var velocityData = velAttr.array;
    var oldParticleCount = properties.currentParticleCount;
    newParticleCount = Math.min(MAX_PARTICLE_COUNT, newParticleCount);
    this._generateParticles(positionData,
      velocityData,
      0,
      (newParticleCount - 1) * 4);
    geometry.setDrawRange(0, newParticleCount);
    posAttr.needsUpdate = true;
    velAttr.needsUpdate = true;
    properties.currentParticleCount = newParticleCount;
  }

  ParticleGeometry.prototype.updateParticleCount = function(newParticleCount) {
    var sourceGeometry = this.getSourceGeometry();
    this._resizeDataForGeometry(sourceGeometry, newParticleCount);
    var targetGeometry = this.getTargetGeometry();
    this._resizeDataForGeometry(targetGeometry, newParticleCount);
  }

  ParticleGeometry.prototype.updateParticleSize = function(size) {
    this._properties.material.uniforms.pointSize.value = size;
  }

  ParticleGeometry.prototype.updateParticleInitialSpeed = function(speed) {
    this._properties.initialSpeed = speed;
  }

  function ParticleEmitter(gl, renderer, scene, initialValues) {
    var properties = this._properties = {
      updateParticleCount: false,
      fixedStep: 16.666666,
      gl: gl,
      renderer: renderer,
      scene: scene
    }

    properties.particleGeometry = new ParticleGeometry(initialValues);
    properties.particleShader = new ParticleShader(renderer);
    properties.transformFeedback = gl.createTransformFeedback();

    scene.add( properties.particleGeometry.getParticleMesh() );
  }

  ParticleEmitter.prototype._transformFeedbackPass = function(source, target) {
    var properties = this._properties;
    var shader = properties.particleShader;
    var renderer = properties.renderer;
    var gl = properties.gl;

    if (!source || !target)
      return;

    var sourcePosAttrib = source.attributes['position'];
    var sourceVelAttrib = source.attributes['velocity'];
    var targetPosAttrib = target.attributes['position'];
    var targetVelAttrib = target.attributes['velocity'];

    var sourcePosBuffer = renderer.properties.get(sourcePosAttrib).__webglBuffer;
    var sourceVelBuffer = renderer.properties.get(sourceVelAttrib).__webglBuffer;
    var targetPosBuffer = renderer.properties.get(targetPosAttrib).__webglBuffer;
    var targetVelBuffer = renderer.properties.get(targetVelAttrib).__webglBuffer;

    if (targetPosBuffer && sourcePosBuffer) {
      shader.bind();

      gl.enableVertexAttribArray( shader.attributes.position );
      gl.bindBuffer(gl.ARRAY_BUFFER, sourcePosBuffer);
      gl.vertexAttribPointer( shader.attributes.position, 4, gl.FLOAT, false, 16, 0 );

      gl.enableVertexAttribArray( shader.attributes.velocity );
      gl.bindBuffer(gl.ARRAY_BUFFER, sourceVelBuffer);
      gl.vertexAttribPointer( shader.attributes.velocity, 4, gl.FLOAT, false, 16, 0 );

      gl.bindTransformFeedback(gl.TRANSFORM_FEEDBACK, properties.transformFeedback);
      gl.bindBufferBase(gl.TRANSFORM_FEEDBACK_BUFFER, 0, targetPosBuffer);
      gl.bindBufferBase(gl.TRANSFORM_FEEDBACK_BUFFER, 1, targetVelBuffer);

      gl.enable(gl.RASTERIZER_DISCARD);
      gl.beginTransformFeedback(gl.POINTS);

      gl.drawArrays(gl.POINTS, 0, sourcePosAttrib.count /* sourcePosAttrib.itemSize */);

      gl.endTransformFeedback();
      gl.disable(gl.RASTERIZER_DISCARD);

      // Unbind the transform feedback buffer so subsequent attempts
      // to bind it to ARRAY_BUFFER work.
      gl.bindBufferBase(gl.TRANSFORM_FEEDBACK_BUFFER, 0, null);
      gl.bindBufferBase(gl.TRANSFORM_FEEDBACK_BUFFER, 1, null);

      gl.bindTransformFeedback(gl.TRANSFORM_FEEDBACK, null);

      // Avoid messing with THREE.js's WebGL state
      // TODO(kbr): Further Diagnosis
      gl.disableVertexAttribArray( shader.attributes.position );
      gl.disableVertexAttribArray( shader.attributes.velocity );
      //gl.disableVertexAttribArray( shader.attributes.origin );
      //gl.disableVertexAttribArray( shader.attributes.randomSeed );
      gl.bindBuffer(gl.ARRAY_BUFFER, null);
    }
  }

  ParticleEmitter.prototype.update = function(t) {
    var properties = this._properties;
    var mesh = properties.particleGeometry.getParticleMesh();

    if (mesh) {
      var particleShader = properties.particleShader;
      var scene = properties.scene;

      var sourceGeometry = properties.particleGeometry.getSourceGeometry();
      var targetGeometry = properties.particleGeometry.getTargetGeometry();
      var updateParticleCount = properties.updateParticleCount;

      if (updateParticleCount) {
        properties.particleGeometry.updateParticleCount(properties.newParticleCount);
        properties.updateParticleCount = false;
      } else {
        properties.particleGeometry.incrementSourceIndex();
      }

      this._transformFeedbackPass(sourceGeometry, targetGeometry);
      mesh.geometry = sourceGeometry;

      particleShader.setTime(t);

      //this._properties.material.uniforms.pointSize.value = pointSize;

      // Ugly hack to make the particle mesh always draw last
      scene.remove( mesh ); scene.add( mesh );
    }
  }

  ParticleEmitter.prototype.updateParticleCount = function(newCount) {
    var properties = this._properties;
    properties.updateParticleCount = true;
    properties.newParticleCount = newCount;
  }

  ParticleEmitter.prototype.updateParticleSize = function(size) {
    var properties = this._properties;
    return properties.particleGeometry.updateParticleSize(size);
  }

  ParticleEmitter.prototype.updateParticleInitialSpeed = function(speed) {
    var properties = this._properties;
    return properties.particleGeometry.updateParticleInitialSpeed(speed);
  }

  return ParticleEmitter;
})();
