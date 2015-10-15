var THREE = require('three');
module.exports = createLoader;

function createLoader(mapInfo, chunkSize) {
  var geometrySize = 2500;
  var data = mapInfo.map;
  var worldSize = mapInfo.size;
  var totalChunks = worldSize/chunkSize;
  var api = {
    load: load,
    totalChunks: totalChunks
  };

  return api;


  function load(chunkX, chunkY) {
    var geometry = new THREE.PlaneBufferGeometry(geometrySize, geometrySize, chunkSize - 1, chunkSize - 1);
    geometry.rotateX(-Math.PI / 2);

    var vertices = geometry.attributes.position.array;

    var i = 0;
    var baseOffset = chunkSize * (chunkX + chunkY * worldSize);

    for (var j = 0; j < vertices.length; j += 3) {
      vertices[j + 1] = data[getGlobalI(i)]; // set Y coordinate of the vertex to the height value
      i += 1;
    }

    var texture = new THREE.CanvasTexture(generateTexture(data, chunkSize, chunkSize));
    texture.wrapS = THREE.ClampToEdgeWrapping;
    texture.wrapT = THREE.ClampToEdgeWrapping;

    var mesh = new THREE.Mesh(geometry, new THREE.MeshBasicMaterial({
      map: texture
    }));
    mesh.position.z = chunkY * geometrySize - 1;
    mesh.position.x = chunkX * geometrySize - 1;

    return mesh;

    function generateTexture(data, width, height) {
      var canvas, canvasScaled, context, image, imageData,
        level, diff, vector3, sun, shade;

      vector3 = new THREE.Vector3(0, 0, 0);

      sun = new THREE.Vector3(1, 1, 1);
      sun.normalize();

      canvas = document.createElement('canvas');
      canvas.width = width;
      canvas.height = height;

      context = canvas.getContext('2d');
      context.fillStyle = '#000';
      context.fillRect(0, 0, width, height);

      image = context.getImageData(0, 0, canvas.width, canvas.height);
      imageData = image.data;

      for (var i = 0, j = 0, l = imageData.length; i < l; i += 4, j++) {
        vector3.x = data[getGlobalI(j - 2)] - data[getGlobalI(j + 2)];
        vector3.y = 2;
        vector3.z = data[getGlobalI(j - width * 2)] - data[getGlobalI(j + width * 2)];
        vector3.normalize();

        shade = vector3.dot(sun);

        var c = 255 * data[getGlobalI(j)] / mapInfo.maxHeight;
        imageData[i] = (96 + shade * 128) * (0.5 + c * 0.007);
        imageData[i + 1] = (32 + shade * 96) * (0.5 + c * 0.007);
        imageData[i + 2] = (shade * 96) * (0.5 + c * 0.007);
      }

      context.putImageData(image, 0, 0);
      return canvas;
    }

    function getGlobalI(i) {
      var x = i % chunkSize;
      var y = Math.floor(i / chunkSize);

      return baseOffset + x + y * worldSize;
    }
  }

}
