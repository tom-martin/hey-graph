var HeyGraph = HeyGraph || {};
HeyGraph.CollectionUtils = HeyGraph.CollectionUtils || {};

HeyGraph.CollectionUtils.contains = function(container, callback) {
  return this.find(container, callback) != null;
};

HeyGraph.CollectionUtils.find = function(container, callback) {
  for(var index in container) {
    var potential = container[index];
    if(callback.call(potential)) {
      return potential;
    }
  }

  return null;
};

HeyGraph.CollectionUtils.filter = function(container, callback) {
  var matches = [];
  for(var index in container) {
    var potential = container[index];
    if(callback.call(potential)) {
      matches.push(potential);
    }
  }

  return matches;
};

HeyGraph.CollectionUtils.reduce = function(container, callback, initial) {
  var current = null;
  for(var index in container) {
    if(current == null) {
      if(initial) {
        current = initial.apply(initial, [container[index]]);
      } else {
        current = container[index];
      }
    } else {
      current = callback.apply(container[index], [current, container[index]]);
    }
  }

  return current;
};
HeyGraph.VectorUtils = HeyGraph.VectorUtils || {};

HeyGraph.VectorUtils.differenceVector = function(vectorA, vectorB) {
  var diff = {};
  diff.x = vectorA.x - vectorB.x;
  diff.y = vectorA.y - vectorB.y;
  return diff;
}

HeyGraph.VectorUtils.magnitude = function(vector) {
  return Math.sqrt((vector.x * vector.x) + (vector.y * vector.y));
};

function SimpleNodeRenderer() {
  this.NODE_WIDTH = 20;
  this.imageCache = {};
  this.maxNodeDimension = this.NODE_WIDTH;

  this.roundRect = function(context, x, y, width, height, radius) {
    context.beginPath();
    context.moveTo(x + radius, y);
    context.lineTo(x + width - radius, y);
    context.arc(x + width - radius, y + radius, radius, Math.PI * 1.5, 0, false);
    context.lineTo(x + width, y + height - radius);
    context.arc(x + width - radius, y + height - radius, radius, 0, Math.PI / 2, false);
    context.lineTo(x + radius, y + height);
    context.arc(x + radius, y + height - radius, radius, Math.PI / 2, Math.PI,false);
    context.lineTo(x, y + radius);
    context.arc(x + radius, y + radius, radius, Math.PI, Math.PI * 1.5,false);
  };
};

SimpleNodeRenderer.prototype.render = function(node, context, graph) {
  context.save();
  var nodeWidth = this.NODE_WIDTH;
  var nodeHeight = this.NODE_WIDTH;

  if(node.graphImageUrl && this.imageCache[node.graphImageUrl] && this.imageCache[node.graphImageUrl] != 'placeholder') {
    // Original resolution: x, y.
    var img = this.imageCache[node.graphImageUrl];
    var x = (node.x * graph.layoutFactor) - (img.width / 2);
    var y = (node.y * graph.layoutFactor) - (img.height / 2);

    context.save();
    context.strokeStyle = "#FFF"; 
    context.lineWidth = 3; 
    this.roundRect(context, x, y, img.width, img.height, 20);
    context.fill();
    context.save();
    this.roundRect(context, x, y, img.width, img.height, 20);
    context.clip();
    context.drawImage(img, x, y);
    context.restore();
    context.shadowColor = null;
    this.roundRect(context, x, y, img.width, img.height, 20);
    context.stroke();
    context.restore();

    var nodeWidth = img.width;
    var nodeHeight = img.height;
  } else {
    if(node.graphImageUrl && this.imageCache[node.graphImageUrl] != 'placeholder' && !graph.running) {
      this.imageCache[node.graphImageUrl] = 'placeholder';
      // Create a new image.
      var img = new Image();

      var imageCache = this.imageCache;
      var rendererThis = this;
      var imageCallback = function(nodeToLoad) {
        var nodeToLoad = nodeToLoad;
        return function() {
          imageCache[nodeToLoad.graphImageUrl] = this;
          rendererThis.maxNodeDimension = Math.max(rendererThis.maxNodeDimension, this.width);
          rendererThis.maxNodeDimension = Math.max(rendererThis.maxNodeDimension, this.height);
          graph.requestRender.call(graph);
        };
      };
      // Once it's loaded draw the image on the canvas.
      img.addEventListener('load', imageCallback(node), false);
      
      img.src = node.graphImageUrl;
    }

    var x = (node.x * graph.layoutFactor);
    var y = (node.y * graph.layoutFactor);

    context.strokeStyle = "#000";      
    context.fillStyle = "#FFF";
    context.beginPath();
    context.arc(x, y, this.NODE_WIDTH / 2, 0, Math.PI*2, true);
    context.closePath();
    context.stroke();
    context.fill();
  }

  if( typeof(context.fillText)=='function' &&
      node.graphCaption) {
    context.fillStyle = "#FFF";
    context.font = 'bold 30px sans-serif';
    var textMetrics = context.measureText(node.graphCaption);
    context.fillText(node.graphCaption, (node.x * graph.layoutFactor) - (textMetrics.width / 2), (node.y * graph.layoutFactor) + 30 + (nodeHeight / 2));
   // this.maxNodeDimension = Math.max(this.maxNodeDimension, textMetrics.width);
  }
  context.restore();
};
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

HeyGraph.GraphUtils.findNodeForId = function(nodeId, graphData) {
  return HeyGraph.CollectionUtils.find(graphData.nodes, function() {
    return nodeId == this.graphId;
  });
}

HeyGraph.GraphUtils.allEdgesForNode = function(edges, nodeId) {
  return HeyGraph.CollectionUtils.filter(edges, function(edge) {
    return (this.nodeAId == nodeId ||
            this.nodeBId == nodeId);
  });
};

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
function HeyGraph(canvas, context, graphData, layoutTime) {
  this.canvas = canvas;
  this.context = context;
  this.graphData = graphData;
  this.nodesHash = {};
  this.nodeRenderer = new SimpleNodeRenderer();
  this.running = false;
  this.layoutFactor = 1;

  this.FRAMES_PER_SECOND = 30;
  this.MILLIS_PER_FRAME = 1000 / 30;

  for(var nodeIndex in graphData.nodes) {
    var currentNode = graphData.nodes[nodeIndex];
    this.nodesHash[currentNode.graphId] = currentNode;
  }

  this.layoutTime = layoutTime;

  this.layout = new ForceDirectedLayout(this.graphData, canvas.width, canvas.height);

  var thisGraph = this;
  this.start = function() {
    thisGraph.layout.initialLayout();
    thisGraph.preUpdateTime = new Date().getTime();
    var layoutTimeMaxMillis = thisGraph.layoutTime * 1000;
    this.running = true;
    var updater = function() {
      var timeForLastRender = 0;
      this.update = function() {
        if(thisGraph.layout.update(thisGraph.MILLIS_PER_FRAME - timeForLastRender) || (layoutTimeMaxMillis && new Date().getTime() - thisGraph.preUpdateTime > layoutTimeMaxMillis)) {
          thisGraph.running = false;
          thisGraph.render();
          clearInterval(clearUpdateInt);
        }

        var preRenderTime = new Date().getTime();
        this.calculateLayoutFactor(this.nodeRenderer.maxNodeDimension);
        thisGraph.render();
        timeForLastRender = Math.min(thisGraph.MILLIS_PER_FRAME / 2, new Date().getTime() - preRenderTime);
      };

      var clearUpdateInt = setInterval(this.update, this.MILLIS_PER_FRAME);
    };
    updater.call();
  };

  this.calculateLayoutFactor = function(nodeSize) {
    this.layoutFactor = 1;
    var requiredDistance = Math.sqrt(nodeSize * nodeSize);
    for(var nodeIndexA in this.graphData.nodes) {
      var nodeA = this.graphData.nodes[nodeIndexA];
      
      for(var nodeIndexB in this.graphData.nodes) {
        var nodeB = this.graphData.nodes[nodeIndexB];
        if( nodeA != nodeB &&
            Math.abs(nodeA.x - nodeB.x) < nodeSize &&
            Math.abs(nodeA.y - nodeB.y) < nodeSize) {
          var diff = HeyGraph.VectorUtils.differenceVector(nodeA, nodeB);   
          var diffMagnitude = Math.abs(HeyGraph.VectorUtils.magnitude(diff));
          if(diffMagnitude > 0) {
            this.layoutFactor = Math.max(this.layoutFactor, (requiredDistance) / diffMagnitude);
          }
        }
      }
    }
  };

  this.render = function() {
    var minX = this.layout.layoutBounds.x;
    var minY = this.layout.layoutBounds.y;
    var maxX = this.layout.layoutBounds.x + this.layout.layoutBounds.width;
    var maxY = this.layout.layoutBounds.y + this.layout.layoutBounds.height;

    var minX = minX * this.layoutFactor;
    var minY = minY * this.layoutFactor;
    var maxX = maxX * this.layoutFactor;
    var maxY = maxY * this.layoutFactor;

    minX -= this.nodeRenderer.maxNodeDimension;
    minY -= this.nodeRenderer.maxNodeDimension;
    maxX += this.nodeRenderer.maxNodeDimension;
    maxY += this.nodeRenderer.maxNodeDimension;

    this.context.save();

    var gradient1 = context.createLinearGradient(this.canvas.width / 2, 0, this.canvas.width / 2, this.canvas.height);

    gradient1.addColorStop(0,   'rgb(0, 0, 100)'); // dark blue
    gradient1.addColorStop(1,   'rgb(0, 0, 25)'); // darker blue
    context.fillStyle = gradient1;
    this.context.fillRect(0, 0, this.canvas.width, this.canvas.height);

    var scaleFactor = Math.min(this.canvas.width / (maxX - minX), this.canvas.height / (maxY - minY));
    this.context.scale(scaleFactor, scaleFactor);
    var widthBounds = this.canvas.width / scaleFactor;
    var heightBounds = this.canvas.height / scaleFactor;

    this.context.translate(((widthBounds / 2) - ((minX + maxX) / 2)), ((heightBounds / 2) - ((minY + maxY) / 2)));

    this.renderEdges();

    for(var nodeIndex in this.graphData.nodes) {
      var node = this.graphData.nodes[nodeIndex];

      this.nodeRenderer.render(node, context, this);
    }
    this.context.restore();

    this.context.save();
    if(this.running) {
      context.fillStyle    = '#fff';
      this.context.strokeStyle = "#fff";     

      var progress = 0;
      if(thisGraph.layoutTime) {
        progress = (new Date().getTime() - this.preUpdateTime) / (thisGraph.layoutTime * 1000);
      }
      progress = Math.min(1, Math.max(progress, this.layout.layoutProgress));
      this.context.strokeRect(5, this.canvas.height - 30, 100, 10);
      this.context.fillRect(5, this.canvas.height - 30, progress * 100, 10);
    }
    this.context.restore();
  };

  this.renderEdges = function() {
    this.context.save();
    this.context.shadowOffsetX = 3;
    this.context.shadowOffsetY = 3;
    this.context.shadowBlur    = 2;
    this.context.shadowColor   = 'rgba(0, 0, 0, 0.5)';

    for(var edgeIndex in this.graphData.edges) {
      var edge = this.graphData.edges[edgeIndex];
      var nodeA = this.nodesHash[edge.nodeAId];
      var nodeB = this.nodesHash[edge.nodeBId];

      this.context.strokeStyle = "#FFF";

      this.context.beginPath();
      this.context.moveTo(nodeA.x * this.layoutFactor, nodeA.y * this.layoutFactor); // give the (x,y) coordinates
      this.context.lineTo(nodeB.x * this.layoutFactor, nodeB.y * this.layoutFactor);
      this.context.closePath();
      this.context.stroke();
    }
    this.context.restore();
  }

  this.renderRequested = false;
  this.requestRender = function() {
    if(!this.renderRequested) {
      this.renderRequested = true;
      setTimeout(this.renderCallback(), this.MILLIS_PER_FRAME);
    }
  };

  this.renderCallback = function() {
	var thisGraph = this;
	return function() {
		  thisGraph.renderRequested = false;
		  thisGraph.render();
	  };
  };
}

