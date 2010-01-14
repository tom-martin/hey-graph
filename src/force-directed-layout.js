function ForceDirectedLayout(graphData, width, height) {
  this.width = width;
  this.height = height;
  this.graphData = graphData;
  this.layoutDone = false;
  this.nodesHash = {};
  var area = width * height;
  this.k = Math.sqrt(area / graphData.nodes.length);
  this.temperature = graphData.nodes.length + Math.floor(Math.sqrt(graphData.edges.length));
  this.minimumTemperature = 1;
  this.initialTemperature = this.temperature;
  this.iteration = 0;
  this.layoutProgess = 0;
  this.layoutBounds = {"x":0, "y":0, "width":0, "height":0};

  for(var nodeIndex in graphData.nodes) {
    var currentNode = graphData.nodes[nodeIndex];
    this.nodesHash[currentNode.graphId] = currentNode;
  }

  this.storePositions = function() {
    var previousNodePositions = {};

    for(var nodeIndex in this.graphData.nodes) {
      var node = this.graphData.nodes[nodeIndex];
      var point = {};
      point.x = node.x;
      point.y = node.y;

      previousNodePositions[node.graphId] = point;
    }

    return previousNodePositions;
  };


  this.calculateRepulsiveDisplacement = function (nodeDisplacement) {
    for(var nodeIndexA in this.graphData.nodes) {
      var nodeA = this.graphData.nodes[nodeIndexA];
      var disp = {};
      disp.x = 0;
      disp.y = 0;
      
      for(var nodeIndexB in this.graphData.nodes) {
        var nodeB = this.graphData.nodes[nodeIndexB];
        
        var diff = HeyGraph.VectorUtils.differenceVector(nodeA, nodeB);
        var diffMagnitude = HeyGraph.VectorUtils.magnitude(diff);
        
        if(diffMagnitude != 0) {
          disp.x += (diff.x / diffMagnitude) * repulsiveForce(diffMagnitude, this.k);
          disp.y += (diff.y / diffMagnitude) * repulsiveForce(diffMagnitude, this.k);
        }
      }
      
      nodeDisplacement[nodeA.graphId] = disp;
    }
  };

  this.calculateAttractiveDisplacement = function (nodeDisplacement) {
    for(var edgeIndex in this.graphData.edges) {
      var edge = this.graphData.edges[edgeIndex];
      var diff = HeyGraph.VectorUtils.differenceVector(this.nodesHash[edge.nodeAId], this.nodesHash[edge.nodeBId]);
      var diffMagnitude = HeyGraph.VectorUtils.magnitude(diff);    

      if(diffMagnitude != 0) {
        var nodeADisplacement = nodeDisplacement[edge.nodeAId];
        nodeADisplacement.x -= (diff.x / diffMagnitude) * attractiveForce(diffMagnitude, this.k);
        nodeADisplacement.y -= (diff.y / diffMagnitude) * attractiveForce(diffMagnitude, this.k);

        var nodeBDisplacement = nodeDisplacement[edge.nodeBId];
        nodeBDisplacement.x += (diff.x / diffMagnitude) * attractiveForce(diffMagnitude, this.k);
        nodeBDisplacement.y += (diff.y / diffMagnitude) * attractiveForce(diffMagnitude, this.k);
      }
    };

    this.isLayoutDone = function() {
      var currentNodePositions = this.storePositions();
      var totalChange = 0;

      var minPosition;    
      var maxPosition;

      for(var nodeIndex in this.graphData.nodes) {
        var nodeId = this.graphData.nodes[nodeIndex].graphId;
        var nodePosition = currentNodePositions[nodeId];

        if(minPosition) {
          minPosition.x = Math.min(minPosition.x, nodePosition.x); 
          minPosition.y = Math.min(minPosition.y, nodePosition.y);
          maxPosition.x = Math.max(maxPosition.x, nodePosition.x);
          maxPosition.y = Math.max(maxPosition.y, nodePosition.y);

        } else {
          minPosition = {};
          maxPosition = {};

          minPosition.x = nodePosition.x;
          minPosition.y = nodePosition.y;
          maxPosition.x = nodePosition.x;  
          maxPosition.y = nodePosition.y;
        }

        var change = Math.abs(HeyGraph.VectorUtils.magnitude(HeyGraph.VectorUtils.differenceVector(this.previousNodePositions[nodeId], nodePosition)));
        totalChange += change;
      }
      var averageChange = totalChange / this.graphData.nodes.length;

      var graphMagnitude = Math.abs(HeyGraph.VectorUtils.magnitude(HeyGraph.VectorUtils.differenceVector(minPosition, maxPosition)));
      var canvasMagnitude = Math.abs(HeyGraph.VectorUtils.magnitude({"x":this.width, "y":this.height}));


      this.minimumTemperature = Math.max(1, (graphMagnitude / canvasMagnitude));
      this.layoutDone = averageChange < (this.minimumTemperature / 2) && (this.temperature <= this.minimumTemperature);
      this.previousNodePositions = currentNodePositions;

      if(this.initialProgress == null && this.temperature <= this.minimumTemperature) {
        this.initialProgress = averageChange - (this.minimumTemperature / 2);
      }

      if(this.initialProgress != null && this.minimumTemperature != 0) {
        this.layoutProgress = Math.max(this.layoutProgress, 1 - ((averageChange - (this.minimumTemperature / 2)) / this.initialProgress));
      }

      if(this.layoutDone) {
        this.layoutProgress = 1;
      }
    };
  };

  this.applyDisplacement = function(nodeDisplacement) {
    var minX = Number.MAX_VALUE;
    var minY = Number.MAX_VALUE;
    var maxX = -Number.MAX_VALUE;
    var maxY = -Number.MAX_VALUE;

    for(var nodeIndex in nodeDisplacement) {
      var node = this.nodesHash[nodeIndex];
      var disp = nodeDisplacement[nodeIndex];
      
      var dispMagnitude = HeyGraph.VectorUtils.magnitude(disp);

      if(dispMagnitude != 0) {

        node.x += (disp.x / dispMagnitude) * Math.min(this.temperature, Math.abs(disp.x));
        node.y += (disp.y / dispMagnitude) * Math.min(this.temperature, Math.abs(disp.y));

        var xDisp = (disp.x / dispMagnitude) * Math.abs(disp.x);
        var yDisp = (disp.y / dispMagnitude) * Math.abs(disp.y);
      }

      minX = Math.min(minX, node.x);
      minY = Math.min(minY, node.y);

      maxX = Math.max(maxX, node.x);
      maxY = Math.max(maxY, node.y);
    }

    this.layoutBounds.x = minX;
    this.layoutBounds.y = minY;
    this.layoutBounds.width = maxX - minX;
    this.layoutBounds.height = maxY - minY;
  }

  function attractiveForce(magnitude, k) {
    return (magnitude * magnitude) / k;
  };

  function repulsiveForce(magnitude, k) {
    return (k * k) / magnitude;
  };
};

ForceDirectedLayout.prototype.initialLayout = function() {
  this.layoutProgress = 0;
  for(var nodeIndex in this.graphData.nodes) {
    this.graphData.nodes[nodeIndex].x = Math.floor(Math.random()*(this.width));
    this.graphData.nodes[nodeIndex].y = Math.floor(Math.random()*(this.height))
  }

  this.previousNodePositions = this.storePositions();
};

ForceDirectedLayout.prototype.update = function(time) {
  var beginning = new Date().getTime();
  var current = beginning;
  var previousNodePositions = this.storePositions();

  while(current - beginning < time && !this.layoutDone) {
    var nodeDisplacement = [];
    this.calculateRepulsiveDisplacement(nodeDisplacement);
    this.calculateAttractiveDisplacement(nodeDisplacement);
    this.applyDisplacement(nodeDisplacement);

    this.temperature -= (this.initialTemperature / 100);
    if(this.iteration % 10 == 0) {
      this.isLayoutDone();
    }

    this.temperature = Math.max(this.temperature, this.minimumTemperature);

    this.iteration++;

    current = new Date().getTime();
  }

  return this.layoutDone;
};
