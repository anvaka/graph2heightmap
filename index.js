module.exports = toHeightmap;

function toHeightmap(graph, getNodePosition) {
  var maxHeight = 1024;
  var aboveWater = 3;
  var minHeight = 1;

  var bounds = getBounds();

  var offsetX = bounds.x - bounds.half;
  var offsetY = bounds.y - bounds.half;

  var squareSize = upperPowerOfTwo((bounds.half + 1) * 2);
  console.log('heightmap side length: ' + squareSize);

  var maxHillRadius = squareSize * 0.01; /// graph.getNodesCount();
  var maxHillRadiusSquared = maxHillRadius * maxHillRadius;

  var size = squareSize * squareSize;
  var heightMap = new Uint16Array(size);
  fillInMap();

  return {
    size: squareSize,
    map: heightMap,
    maxHeight: maxHeight,
    waterLevel: aboveWater
  };

  function getBounds() {
    var minX = 0;
    var maxX = 0;
    var minY = 0;
    var maxY = 0;
    var maxDegree = 0;

    graph.forEachNode(computeMetadata);

    var half = (Math.max((maxX - minX), (maxY - minY)))/2;

    return {
      maxDegree: maxDegree,
      x: (minX + half),
      y: (minY + half),
      half: half
    };

    function computeMetadata(node) {
      var pos = getNodePosition(node);
      var degree = getDegree(node.id);

      if (pos.x < minX) minX = pos.x;
      if (pos.y < minY) minY = pos.y;
      if (pos.x > minX) maxX = pos.x;
      if (pos.y > minY) maxY = pos.y;
      if (degree > maxDegree) maxDegree = degree;
    }
  }

  function fillInMap() {
    // first set positions which are known
    graph.forEachNode(setPositionOnHeightMap);
    for (var i = 0; i < squareSize; ++i) {
      if (!isSet(i, 0)) set(i, 0, minHeight);
      if (!isSet(0, i)) set(0, i, minHeight);
    }
    // On second iteration we surround each node with height additonal data
    graph.forEachNode(surroundMountain);
  }

  function surroundMountain(node) {
    var pos = getNodePosition(node);
    // convert to heightmap coordinates:
    var x = Math.round(pos.x - offsetX);
    var y = Math.round(pos.y - offsetY);
    var degree = getDegree(node.id);
    var height = degreeHeight(degree);
    var size = Math.ceil(maxHillRadius) + 1;
    var fromX = x - size;
    var toX = x + size;
    var fromY = y - size;
    var toY = y + size;

    for (var i = fromX; i < toX; ++i) {
      if (i <= 0 || i >= squareSize) continue; // out of bounds
      for (var j = fromY; j < toY; ++j) {
        if (j <= 0 || j >= squareSize) continue;
        if (i === x && j === y) continue;
        if (isSet(i, j)) continue;
        var iHeight = getInterpolatedHeight(i, j, x, y, height);
        set(i, j, iHeight);
      }
    }
  }

  function isSet(x, y) {
    return heightMap[x + y * squareSize] > 0;
  }

  function getInterpolatedHeight(x, y, cx, cy, nearestNodeHeight) {
    var dist = getDistance(x, y, cx, cy);
    if (dist > maxHillRadiusSquared) return 0;
    var change = dist / maxHillRadiusSquared;
    var x = (1 - change) * 4.4;
    var height = (Math.sin(x - Math.PI * 1.42) / (x - Math.PI * 1.42) + 0.22) / 1.22;
    return (height * nearestNodeHeight) | 0;
  }

  function getDistance(x, y, x1, y1) {
    return (x1 - x) * (x1 - x) + (y1 - y) * (y1 - y);
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

  function get(x, y) {
    return heightMap[x + squareSize * y];
  }

  function degreeHeight(degree) {
    var height = (maxHeight - aboveWater) * degree / bounds.maxDegree +
      aboveWater;
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
