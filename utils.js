var Utils = {
  // max is exclusive
  getRandomInt: (min, max) => {
    min = Math.ceil(min);
    max = Math.floor(max);
    return Math.floor(Math.random() * (max - min)) + min;
  },

  // drags value to either min or max, whichever is closer
  drag: (value, min, max) => {
    var p = value / (min + max) - min;
    return p < 0.5 ? min : max;
  },

  pimpFloatArray: () => {
    Float32Array.createDimensional = function(size, dimension) {
      var arr = new Float32Array(size * dimension);
      arr._dimension = dimension;
      return arr;
    }

    Float32Array.prototype.setX = function(index, val) {
      var dimension = this._dimension;
      this[index * dimension] = val;
    }

    Float32Array.prototype.setY = function(index, val) {
      var dimension = this._dimension;
      this[index * dimension + 1] = val;
    }

    Float32Array.prototype.setZ = function(index, val) {
      var dimension = this._dimension;
      this[index * dimension + 2] = val;
    }
  },

  getRandomPositionOnRectangleEdge: (width, height) => {
    var sides = Math.random() * (2 * width + 2 * height);
    var goesToSides = sides < 2 * height;
    // create a coordinate with random position values on edges
    var pX = goesToSides ? Utils.getRandomInt(0, 2) * width : Math.random() * height,
        pY = !goesToSides ? Utils.getRandomInt(0, 2) * height : Math.random() * width;

    return { x: pX, y: pY };
  },

  getRandomPositionOnCircle: (radius) => {
    var angle = THREE.Math.randFloat(0, 2 * Math.PI);
    var euler = new THREE.Euler(0, 0, angle, 'XYZ');
    var v = new THREE.Vector3(1, 0, 0);
    v.applyEuler(euler);
    v.multiplyScalar(radius);
    return v;
  },

  copyFromArrayToArray: (fromArray, toArray, fromIndex, toIndex) => {
    for (var i = fromIndex; i <= toIndex; ++i) {
      toArray[i] = fromArray[i];
    }
  }
}
