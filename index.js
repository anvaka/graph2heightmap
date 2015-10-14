var createTree = require('yaqt');
module.exports = toHeightmap;

function toHeightmap(graph, getNodePosition) {
  var positions = [];
  var indexToNodeHeight = [];
  var maxHeight = 1024;
  var aboveWater = 3;
  var minHeight = 1;
  var maxDegree = 0;
  graph.forEachNode(savePosition);
  graph.forEachNode(saveHeight);

  var tree = createTree();
  tree.init(positions);
  var bounds = tree.bounds();
  var offsetX = bounds.x - bounds.half;
  var offsetY = bounds.y - bounds.half;

  var squareSize = upperPowerOfTwo((bounds.half + 1) * 2);
  console.log('heightmap side length: ' + squareSize);

  var maxHillRadius = squareSize * 0.01;
  var maxHillRadiusSquared = maxHillRadius * maxHillRadius;

  var size = squareSize * squareSize;
  var heightMap = new Uint16Array(size);
  fillInMap();

  return {
    size: squareSize,
    map: heightMap,
    maxHeight: maxHeight
  };

  function saveHeight(node) {
    var degree = getDegree(node.id);
    indexToNodeHeight.push(degreeHeight(degree));
  }

  function savePosition(node) {
    var pos = getNodePosition(node);
    positions.push(pos.x, pos.y);
    var degree = getDegree(node.id);

    if (degree > maxDegree) maxDegree = degree;
  }

  function fillInMap() {
    // first set positions which are known
    graph.forEachNode(setPositionOnHeightMap);
    for (var i = 0; i < squareSize; ++i) {
      if (!isSet(i, 0)) set(i, 0, minHeight);
      if (!isSet(0, i)) set(0, i, minHeight);
    }
    for (var i = 0; i < squareSize; ++i) {
      for (var j = 0; j < squareSize; ++j) {
        if (isSet(i, j)) {
          // skip
          continue;
        }
        var height = getInterpolatedHeight(i, j);
        set(i, j, height);
      }
    }
  }

  function isSet(x, y) {
    return heightMap[x + y * squareSize] > 0;
  }

  function getInterpolatedHeight(canvasX, canvasY) {
    // need to transform to graph coordinates for proximity search:
    var x = canvasX + offsetX;
    var y = canvasY + offsetY;
    var nearestPoints = getNearestPoints(x, y);
    nearestPoints.sort(byDistance);
    if (nearestPoints.length === 0) return minHeight;

    var count = Math.min(1, nearestPoints.length);
    var avg = 0;
    for (var i = 0; i < count; ++i) {
      var ptIndex = nearestPoints[i];
      avg += getSlopeToNearest(x, y, ptIndex);
    }
    return avg/count;

    function byDistance(i, j) {
      var x1 = positions[i], y1 = positions[i + 1],
        x2 = positions[j], y2 = positions[j + 1];
      return getDistance(x, y, i) - getDistance(x, y, j);
    }
  }


  function getSlopeToNearest(x, y, index) {
    var dist = getDistance(x, y, index);
    if (dist > maxHillRadiusSquared) dist = maxHillRadiusSquared;
    var change = dist/maxHillRadiusSquared;
    var x = (1 - change) * 4.4;
    var height = (Math.sin(x - Math.PI * 1.42)/(x - Math.PI * 1.42) +0.22)/1.22;
    var nearestNodeHeight = indexToNodeHeight[index/2];
    return (height * nearestNodeHeight)|0;
  }

  function getDistance(x, y, index) {
    var x1 = positions[index];
    var y1 = positions[index + 1];
    return (x1 - x) * (x1 - x) + (y1 - y) * (y1 - y);
  }

  function getNearestPoints(x, y) {
    return tree.pointsAround(x, y, maxHillRadius);
  }

  function setPositionOnHeightMap(node) {
    var pos = getNodePosition(node);
    var x = pos.x - offsetX;
    var y = pos.y - offsetY;
    var degree = getDegree(node.id);
    set(x, y, degreeHeight(degree));
  }

  function set(x, y, height) {
    x = Math.round(x);
    y = Math.round(y);
    heightMap[x + squareSize * y] = height;
  }

  function degreeHeight(degree) {
    var height = (maxHeight - aboveWater) * degree / maxDegree + aboveWater;
    return height | 0;
  }

  function getDegree(nodeId) {
    var links = graph.getLinks(nodeId);
    if (!links) return 0;
    return links.length;

    var degree = 0;
    graph.forEachLinkedNode(nodeId, function(other, link) {
      if (link.toId === nodeId) degree++;
    });
    return degree;
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
