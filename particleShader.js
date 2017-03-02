/*
Copyright (c) 2015, Brandon Jones.

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in
all copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN
THE SOFTWARE.
*/

var ParticleShader = function (renderer) {
  var gl = renderer.context;

  const uniformSettings = {
    gravitationalConstant: 10.0,
    particleMass: 1.0,
    blackHoleMass: 30.0
  }

  const blackHolePosition = new THREE.Vector3(0, 0, 0);

  var attributes = {
    position: 0,
    velocity: 1
  };

  function createProgram () {
    var vertexShader = gl.createShader( gl.VERTEX_SHADER );
    var fragmentShader = gl.createShader( gl.FRAGMENT_SHADER );

    gl.shaderSource( vertexShader, ['#version 300 es',
      'precision ' + renderer.getPrecision() + ' float;',

      'in vec4 position;',
      'in vec4 velocity;',

      'out vec4 outPosition;',
      'out vec4 outVelocity;',

      'uniform float time;',
      'uniform float timeDelta;',
      'uniform float gravitationalConstant;',
      'uniform float particleMass;',
      'uniform float blackHoleMass;',

      'float getForce(float distance) {',
      '  return timeDelta / 1000.0 * gravitationalConstant * particleMass * blackHoleMass / (distance * distance);',
      '}',

      'void runSimulation(vec4 pos, vec4 vel, out vec4 outPos, out vec4 outVel) {',
      '  vec4 direction = vec4(0, 0, 0, 0) - pos;',
      '  float distance = length(direction);',
      '  float force = getForce(distance);',
      '  vec4 velAdd = normalize(direction) * force;',
      '  vel = vel + velAdd;',
      '  outPos.x = pos.x + vel.x;',
      '  outPos.y = pos.y + vel.y;',
      '  outPos.z = pos.z + vel.z;',
      '  outPos.w = pos.w;',
      '  outVel = vel;',
      '}',

      'void main() {',
      '  runSimulation(position, velocity, outPosition, outVelocity);',
      '}'
    ].join( '\n' ) );

    gl.shaderSource( fragmentShader, ['#version 300 es',
      'precision ' + renderer.getPrecision() + ' float;',

      'out vec4 fragColor;',

      'void main() {',
        'fragColor = vec4(1.0, 1.0, 1.0, 1.0);',
      '}'
    ].join( '\n' ) );

    gl.compileShader( vertexShader );
    if (!gl.getShaderParameter(vertexShader, gl.COMPILE_STATUS)) {
      console.error("Shader failed to compile", gl.getShaderInfoLog( vertexShader ));
      return null;
    }

    gl.compileShader( fragmentShader );
    if (!gl.getShaderParameter(fragmentShader, gl.COMPILE_STATUS)) {
      console.error("Shader failed to compile", gl.getShaderInfoLog( fragmentShader ));
      return null;
    }

    var program = gl.createProgram();

    gl.attachShader( program, vertexShader );
    gl.attachShader( program, fragmentShader );

    gl.deleteShader( vertexShader );
    gl.deleteShader( fragmentShader );

    for (var i in attributes) {
      gl.bindAttribLocation( program, attributes[i], i );
    }

    gl.transformFeedbackVaryings( program, ["outPosition", "outVelocity"], gl.SEPARATE_ATTRIBS );

    gl.linkProgram( program );

    if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
      console.error("Shader program failed to link", gl.getProgramInfoLog( program ));
      gl.deleteProgram(program);
      return null;
    }

    return program;
  };

  var program = createProgram();

  if (!program) {
    return null;
  }

  var uniforms = {};
  var count = gl.getProgramParameter(program, gl.ACTIVE_UNIFORMS);
  for (var i = 0; i < count; i++) {
      uniform = gl.getActiveUniform(program, i);
      name = uniform.name.replace("[0]", "");
      uniforms[name] = gl.getUniformLocation(program, name);
  }

  var timeValue = 0;
  var timeDelta = 0;

  return {
    program: program,

    attributes: attributes,

    bind: function() {
      gl.useProgram(program);
      gl.uniform1f(uniforms.time, timeValue);
      gl.uniform1f(uniforms.timeDelta, timeDelta);
      gl.uniform1f(uniforms.gravitationalConstant, uniformSettings.gravitationalConstant);
      gl.uniform1f(uniforms.particleMass, uniformSettings.particleMass);
      gl.uniform1f(uniforms.blackHoleMass, uniformSettings.blackHoleMass);
    },

    setColliders: function ( colliders ) {
      collidersValue = colliders;
    },

    setTime: function ( time ) {
      if (timeValue === 0) {
        timeDelta = 0;
      } else {
        timeDelta = Math.abs(timeValue - time);
      }
      timeValue = time;
    },

    getTime: function ( time ) {
      return timeValue;
    },

    setUniform: function(uniform, value) {
      uniformSettings[uniform] = value;
    }

  }

};
