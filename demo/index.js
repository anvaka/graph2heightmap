var graph = require('ngraph.generators').wattsStrogatz(100, 20, 0.01);
var graph = require('ngraph.generators').grid(10, 10);
var layout = require('ngraph.forcelayout')(graph);

console.log('Performing graph layout');
for (var i = 0; i < 150; ++i) {
  layout.step();
}
console.log('Done. Generating height map');

//var fromjson = require('ngraph.fromjson');
//var json = require('./graph.json');
//var graph = fromjson(json)

var toHeightmap = require('../');
var mapInfo = toHeightmap(graph, getPosition);

function getPosition(node) {
  var pos = layout.getNodePosition(node.id);
//  var pos = graph.getNode(node.id).data.pos;
  return {
    x: pos.x,//* 0.05,
    y: pos.y//* 0.05
  }
}

// THREE.JS stuff
var THREE = require('three');
var fly = require('three.fly');
var container, stats;

var camera, controls, scene, renderer;

var mesh, texture;

var worldWidth = mapInfo.size,
  worldDepth = mapInfo.size,
  worldHalfWidth = worldWidth / 2,
  worldHalfDepth = worldDepth / 2;

var clock = new THREE.Clock();

init();
animate();

function init() {

  container = document.getElementById('container');

  camera = new THREE.PerspectiveCamera(60, window.innerWidth / window.innerHeight, 1, 20000);

  scene = new THREE.Scene();

  controls = fly(camera, container, THREE);
  controls.movementSpeed = 1000;
  controls.rollSpeed = 0.5;

  data = mapInfo.map;

  camera.position.y = data[worldHalfWidth + worldHalfDepth * worldWidth] * 10 + 500;

  var geometry = new THREE.PlaneBufferGeometry(7500, 7500, worldWidth - 1, worldDepth - 1);
  geometry.rotateX(-Math.PI / 2);

  var vertices = geometry.attributes.position.array;

  for (var i = 0, j = 0, l = vertices.length; i < l; i++, j += 3) {

    vertices[j + 1] = data[i];

  }

  texture = new THREE.CanvasTexture(generateTexture(data, worldWidth, worldDepth));
  texture.wrapS = THREE.ClampToEdgeWrapping;
  texture.wrapT = THREE.ClampToEdgeWrapping;

  mesh = new THREE.Mesh(geometry, new THREE.MeshBasicMaterial({
    map: texture
  }));
  scene.add(mesh);

  renderer = new THREE.WebGLRenderer();
  renderer.setClearColor(0xbfd1e5);
  renderer.setPixelRatio(window.devicePixelRatio);
  renderer.setSize(window.innerWidth, window.innerHeight);

  container.innerHTML = "";

  container.appendChild(renderer.domElement);

  window.addEventListener('resize', onWindowResize, false);
}

function onWindowResize() {

  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();

  renderer.setSize(window.innerWidth, window.innerHeight);
}

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

    vector3.x = data[j - 2] - data[j + 2];
    vector3.y = 2;
    vector3.z = data[j - width * 2] - data[j + width * 2];
    vector3.normalize();

     shade = vector3.dot(sun);

     var c = 255*data[j]/mapInfo.maxHeight;
     imageData[i] = (96 + shade * 128) * (0.5 + c * 0.007);
     imageData[i + 1] = (32 + shade * 96) * (0.5 + c * 0.007);
     imageData[i + 2] = (shade * 96) * (0.5 + c * 0.007);
  }

  context.putImageData(image, 0, 0);
  return canvas;
}

//

function animate() {

  requestAnimationFrame(animate);

  render();
}

function render() {
  controls.update(clock.getDelta());
  renderer.render(scene, camera);
}
