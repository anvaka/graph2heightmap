var createTree = require('yaqt');
module.exports = toHeightmap;
var aboveWater = 3;

function toHeightmap(graph, getNodePosition) {
  var positions = [];
  var maxDegree = 0;
  graph.forEachNode(savePosition);

  var tree = createTree();
  tree.init(positions);
  var bounds = tree.bounds();
  var offsetX = bounds.x - bounds.half;
  var offsetY = bounds.y - bounds.half;

  var squareSize = upperPowerOfTwo((bounds.half + 1) * 2);
  var size = squareSize * squareSize;
  var heightMap = new Uint8Array(size);
  fillInMap();

  return {
    size: squareSize,
    map: heightMap
  };

  function savePosition(node) {
    var pos = getNodePosition(node);
    positions.push(pos.x, pos.y);
    var degree = getDegree(node.id);

    if (degree > maxDegree) maxDegree = degree;
  }

  function fillInMap() {
    // first set positions which are known
    graph.forEachNode(setPositionOnHeightMap);
  }

  function setPositionOnHeightMap(node) {
    var pos = getNodePosition(node);
    var x = pos.x - offsetX;
    var y = pos.y - offsetY;
    set(x, y,  degreeHeight(node.id))
  }

  function set(x, y, height) {
    x = Math.round(x);
    y = Math.round(y);
    heightMap[x + squareSize * y] = height;
  }

  function degreeHeight(nodeId) {
    var degree = getDegree(nodeId);
    var height = (255 - aboveWater) * degree / maxDegree + aboveWater;
    return height | 0;
  }

  function getDegree(nodeId) {
    var links = graph.getLinks(nodeId);
    if (!links) return 0;
    return links.length;
  }
}

function upperPowerOfTwo(v) {
  v = Math.ceil(v);
  v--;
  v |= v >> 1;
  v |= v >> 2;
  v |= v >> 4;
  v |= v >> 8;
  v |= v >> 16;
  v++;
  return v;
}
