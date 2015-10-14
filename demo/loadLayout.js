var fs = require('fs');
var path = require('path');
var graphFolder = path.join(__dirname, '..', '..', 'allnpmviz.an', 'data');

var createGraph = require('ngraph.graph');

module.exports = loadLayout;

function loadLayout() {
  var graph = createGraph({
    uniqueLinksId: false
  });
  addNodes();
  addLinks();

  return {
    graph: graph,
    layout: {
      getNodePosition: function(nodeId) {
        return graph.getNode(nodeId).data.pos;
      }
    }
  }

  function addNodes() {
    var nodes = fs.readFileSync(path.join(graphFolder, 'positions.bin'));
    var x, y;
    var recordsPerNode = 4 * 2;
    for (var i = 0; i < nodes.length; i += recordsPerNode) {
      x = nodes.readInt32LE(i);
      y = nodes.readInt32LE(i + 4);
      graph.addNode(i / recordsPerNode - 1, {
        pos: {
          x: x,
          y: y
        }
      });
    }
  }

  function addLinks() {
    var links = fs.readFileSync(path.join(graphFolder, 'links.bin'));
    var lastFromId;
    for (var i = 0; i < links.length; i += 4) {
      var id = links.readInt32LE(i);
      if (id < 0) {
        lastFromId = -id - 1;
      } else {
        graph.addLink(lastFromId, id - 1);
      }
    }
  }
}
