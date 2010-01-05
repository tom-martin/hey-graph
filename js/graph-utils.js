function normalizeGraph(graphData) {
  var graphs = [];

  for(var nodeIndex in graphData.nodes) {
    var node = graphData.nodes[nodeIndex];
    if(!contains(graphs, function() {
        return contains(this.nodes, function() {
          return this.graphId = node.graphId;
          });
      })) {
      var newGraph = {};
      newGraph.nodes = [];
      newGraph.edges = [];
      addNodeToGraph(node, newGraph, graphData);
      graphs.push(newGraph);
      break;
    }
  }

  return graphs;
};

function arrayIndexOf(arrayToSearch, target) {
  for(var arrayIndex in arrayToSearch) {
    if(arrayToSearch[arrayIndex] === target) {
      return arrayIndex;
    }
  }

  return -1;
};

function addNodeToGraph(node, newGraph, graphData) {
  if(findNodeForId(node.graphId, newGraph) == null) {
    newGraph.nodes.push(node);
    var allEdges = allEdgesForNode(graphData.edges, node.graphId);
    for(edgeIndex in allEdges) {
      var edge = allEdges[edgeIndex];
      newGraph.edges.push(edge);
      if(edge.nodeAId == node.graphId) {
        addNodeToGraph(findNodeForId(edge.nodeBId, graphData), newGraph, graphData);
      } else {
        addNodeToGraph(findNodeForId(edge.nodeAId, graphData), newGraph, graphData);
      }
    }
  }
};

function findNodeForId(nodeId, graphData) {
  return find(graphData.nodes, function() {
    return nodeId == this.graphId;
  });
}

function allEdgesForNode(edges, nodeId) {
  return filter(edges, function(edge) {
    return (this.nodeAId == nodeId ||
            this.nodeBId == nodeId);
  });
};

function printGraph(graphData) {
  console.log(graphData);
}
