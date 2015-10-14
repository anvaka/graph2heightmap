// This will load ngraph.tobinary saved file. just for test purpose keeping it here
var fs = require('fs');
var path = require('path');
var data = require('./loadLayout.js')();
var layout = data.layout;
var graph = data.graph;
var tojson = require('ngraph.tojson');
fs.writeFileSync(path.join(__dirname, 'graph.json'), tojson(graph), 'utf8');

