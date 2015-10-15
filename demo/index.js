//var graph = require('ngraph.generators').wattsStrogatz(100, 20, 0.01);
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
 // var pos = graph.getNode(node.id).data.pos;
  return {
    x: pos.x,
    y: pos.y
  };
}

// THREE.JS stuff
var THREE = require('three');
var fly = require('three.fly');
var container, stats;

var camera, controls, scene, renderer;

var createLoader = require('./chunkLoader.js');
var chunks = createLoader(mapInfo, 256);

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

  camera.position.y = 500;

  renderer = new THREE.WebGLRenderer();
  renderer.setClearColor(0xbfd1e5);
  renderer.setPixelRatio(window.devicePixelRatio);
  renderer.setSize(window.innerWidth, window.innerHeight);

  container.innerHTML = "";

  container.appendChild(renderer.domElement);

  var size = chunks.totalChunks;
  for (var i = 0; i < size; ++i) {
    for (var j = 0; j < size; ++j) {
      var mesh = chunks.load(i, j);
      scene.add(mesh);
    }
  }

  window.addEventListener('resize', onWindowResize, false);
}

function onWindowResize() {

  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();

  renderer.setSize(window.innerWidth, window.innerHeight);
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
