const INITIAL_VALUES = {
  particleCount: 50000,
  particleSize: 2,
  speed: 0.5,
  gravitationalConstant: 10.0
}

function ParamHandler(particleEmitter) {
  const paramsForm = document.getElementById("params-form");
  const particleCountParam = document.getElementById("particle-count-param");
  const particleSizeParam = document.getElementById("particle-size-param");
  const particleInitialSpeedParam = document.getElementById("particle-initial-speed-param");
  const gravitationalConstantParam = document.getElementById("gravitational-constant-param");

  particleCountParam.value = INITIAL_VALUES.particleCount;
  particleSizeParam.value = INITIAL_VALUES.particleSize;
  particleInitialSpeedParam.value = INITIAL_VALUES.speed;
  gravitationalConstantParam.value = INITIAL_VALUES.gravitationalConstant;

  paramsForm.addEventListener( 'submit', onParamsSubmit, false );

  function onParamsSubmit(e) {
    e.preventDefault();
    particleEmitter.updateParticleCount(
      getIntegerParam(particleCountParam, MAX_PARTICLE_COUNT, 1));
    particleEmitter.updateParticleSize(
      getIntegerParam(particleSizeParam, 20, 1));
    particleEmitter.updateParticleInitialSpeed(
      getFloatParam(particleInitialSpeedParam));

    var shader = particleEmitter._properties.particleShader;
    shader.setUniform('gravitationalConstant', getFloatParam(gravitationalConstantParam));
	}

  function getIntegerParam(input, maxVal, minVal) {
    var val = parseInt(input.value);
    if (maxVal) {
      val = Math.min(maxVal, val);
    }
    if (minVal) {
      val = Math.max(minVal, val);
    }
    input.value = val;
    return val;
  }

  function getFloatParam(input, maxVal) {
    var val = parseFloat(input.value);
    if (maxVal && val > maxVal) {
      val = maxVal;
      input.value = count;
    }
    return val;
  }
}

function App() {
  var gl, renderer, camera, scene, canvas;
  var container = document.getElementById("stage");
  var particleEmitter;
  var paramHandler;

  function initWebGL() {
    var gl = null;

    canvas = document.createElement( 'canvas' );

    // Try to grab the standard context. If it fails, fallback to experimental.
    gl = canvas.getContext('webgl2') || canvas.getContext('experimental-webgl2');

    // If we don't have a GL context, give up now
    if (!gl) {
      alert('Unable to initialize WebGL. Your browser may not support it.');
    }

    return gl;
  }

  function init() {
    gl = initWebGL();
		//
		renderer = createRenderer(canvas, gl);
    container.appendChild( renderer.domElement );

    scene = new THREE.Scene();

    camera = new THREE.PerspectiveCamera( 75, container.offsetWidth / container.offsetHeight, 0.01, 1000 );
    camera.position.z = 100;
    scene.add( camera );

    particleEmitter = new ParticleEmitter(gl, renderer, scene, INITIAL_VALUES);
    paramHandler = new ParamHandler(particleEmitter);
  }

  function onWindowResize() {
		camera.aspect = container.offsetWidth / container.offsetHeight;
		camera.updateProjectionMatrix();
    renderer.setSize( container.offsetWidth, container.offsetHeight );
	}

  window.addEventListener( 'resize', onWindowResize, false );

  function createRenderer(canvas, context) {
    var renderer = new THREE.WebGLRenderer( {
      canvas: canvas,
      context: context,
      antialias: false
    } );
    renderer.sortObjects = false;
		renderer.setPixelRatio( window.devicePixelRatio );
		renderer.setSize( container.offsetWidth, container.offsetHeight );
    return renderer;
  }

  function render(t) {
    requestAnimationFrame( render );

    particleEmitter.update(t);

    renderer.resetGLState();

    renderer.render( scene, camera );
  }

  init();

  requestAnimationFrame(render);
}

function startApp() {
  // Start clock app
  const app = new App();
}
