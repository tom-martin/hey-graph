HeyGraph.GraphUtils = HeyGraph.GraphUtils || {};

HeyGraph.GraphUtils.normalizeGraph = function(graphData) {
  var graphs = [];

  for(var nodeIndex in graphData.nodes) {
    var node = graphData.nodes[nodeIndex];
    if(!HeyGraph.CollectionUtils.contains(graphs, function() {
        return HeyGraph.CollectionUtils.contains(this.nodes, function() {
          return this.graphId = node.graphId;
          });
      })) {
      var newGraph = {};
      newGraph.nodes = [];
      newGraph.edges = [];
      this.addNodeToGraph(node, newGraph, graphData);
      graphs.push(newGraph);
      break;
    }
  }

  return graphs;
};

HeyGraph.GraphUtils.addNodeToGraph = function(node, newGraph, graphData) {
  if(this.findNodeForId(node.graphId, newGraph) == null) {
    newGraph.nodes.push(node);
    var allEdges = this.allEdgesForNode(graphData.edges, node.graphId);
    for(edgeIndex in allEdges) {
      var edge = allEdges[edgeIndex];
      newGraph.edges.push(edge);
      if(edge.nodeAId == node.graphId) {
        this.addNodeToGraph(this.findNodeForId(edge.nodeBId, graphData), newGraph, graphData);
      } else {
        this.addNodeToGraph(this.findNodeForId(edge.nodeAId, graphData), newGraph, graphData);
      }
    }
  }
};

HeyGraph.GraphUtils.findNodeForId = (nodeId, graphData) => HeyGraph.CollectionUtils.find(graphData.nodes, function() {
  return nodeId == this.graphId;
})

HeyGraph.GraphUtils.allEdgesForNode = (edges, nodeId) => HeyGraph.CollectionUtils.filter(edges, function(edge) {
  return (this.nodeAId == nodeId ||
          this.nodeBId == nodeId);
});
