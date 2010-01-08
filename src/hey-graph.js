function HeyGraph(canvas, context, graphData) {
  this.canvas = canvas;
  this.context = context;
  this.graphData = graphData;
  this.nodesHash = {};

  this.layoutDone = false;

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


  this.previousNodePositions = this.storePositions();

  this.NODE_WIDTH = 20;

  this.maxTemp = Math.min(canvas.width / 10, graphData.nodes.length + graphData.edges.length, canvas.height / 10);
  this.temp = Math.min(canvas.width / 10, graphData.nodes.length + graphData.edges.length, canvas.height / 10);
  this.tempDiff = -0.5;

  var area = canvas.width * canvas.height;
  this.k = Math.sqrt(area / graphData.nodes.length);

  for(var nodeIndex in graphData.nodes) {
    graphData.nodes[nodeIndex].x = Math.floor(Math.random()*(canvas.width));
    graphData.nodes[nodeIndex].y = Math.floor(Math.random()*(canvas.height))
  }

  this.nodeHistoryCounter = 0;
  this.tempBeforeReset = 0;

  var thisGraph = this;
  var updater = function() {
    this.update = function() {
      if(thisGraph.update(1000 / 30)) {
        clearInterval(clearUpdateInt);
        thisGraph.render();
      }
    };        

    var clearUpdateInt = setInterval(this.update, 1000 / 30);
  };
  updater.call();

  this.update = function(time) {
    var beginning = new Date().getTime();
    var current = beginning;
    var previousNodePositions = this.storePositions();

    if(!this.layoutDone) {
      while(current - beginning < time) {
        var nodeDisplacement = [];
        this.calculateRepulsiveDisplacement(nodeDisplacement);
        this.calculateAttractiveDisplacement(nodeDisplacement);
        var biggestDisplacement = this.applyDisplacement(nodeDisplacement);

        this.nodeHistoryCounter++;
        this.tempBeforeReset++;
        this.temp = Math.max(this.temp - 1, 1);

        if(this.temp == 1 && this.tempBeforeReset > this.maxTemp * this.maxTemp) {
      //    console.log("resetting temp to " + this.maxTemp);
          this.temp = this.maxTemp;
          this.tempBeforeReset = 0;
        }

 //       if(this.temp == 1) {
 //         this.tempDiff = 1;
 //       } else if(this.temp > this.maxTemp) {
 //         this.tempDiff = -1;
 //       }

        if(this.nodeHistoryCounter % 100 == 0) {
          var currentNodePositions = this.storePositions();
          var maxChange = 0;
          var totalChange = 0;    
          for(var nodeIndex in this.graphData.nodes) {
            var nodeId = this.graphData.nodes[nodeIndex].graphId;
            var change = Math.abs(HeyGraph.VectorUtils.magnitude(HeyGraph.VectorUtils.differenceVector(this.previousNodePositions[nodeId], currentNodePositions[nodeId])));
            totalChange += change;
            maxChange = Math.max(maxChange, change);
          }
          var averageChange = totalChange / this.graphData.nodes.length;

//          console.log("Temp : " + this.temp + " | Max Change : " + maxChange + " | Average change : " + averageChange + " | Iterations" + this.nodeHistoryCounter);

          this.layoutDone = (maxChange < 0.5 || averageChange < 0.1);
          this.previousNodePositions = currentNodePositions;
        }

        current = new Date().getTime();
      }
    }

    this.render();

  //  console.log(this.temp + ", " + this.nodeHistoryCounter);

    return this.layoutDone;
  };

  this.render = function() {
    var minX = Number.MAX_VALUE;
    var minY = Number.MAX_VALUE;
    var maxX = 0;
    var maxY = 0;
    for(nodeIndex in this.graphData.nodes) {
      var node = this.graphData.nodes[nodeIndex];
      minX = Math.min(minX, node.x);
      minY = Math.min(minY, node.y);

      maxX = Math.max(maxX, node.x);
      maxY = Math.max(maxY, node.y);
    }

    minX -= this.NODE_WIDTH;
    minY -= this.NODE_WIDTH;
    maxX += this.NODE_WIDTH;
    maxY += this.NODE_WIDTH;

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
      this.context.moveTo(nodeA.x, nodeA.y); // give the (x,y) coordinates
      this.context.lineTo(nodeB.x, nodeB.y);
      this.context.stroke();
      this.context.closePath();

    }

    for(var nodeIndex in this.graphData.nodes) {

      this.context.strokeStyle = "#000";      
      this.context.fillStyle = "#FFF";
      this.context.beginPath();
      this.context.arc(this.graphData.nodes[nodeIndex].x, this.graphData.nodes[nodeIndex].y, this.NODE_WIDTH / 2, 0, Math.PI*2, true);
      this.context.closePath();
      this.context.stroke();
      this.context.fill();
    }

    this.context.restore();
    if(!this.layoutDone) {
      context.fillStyle    = '#fff';
      context.font         = 'bold 30px sans-serif';
      context.fillText('Laying out ...', 5, this.canvas.height - 15);
    }
  };

  function attractiveForce(magnitude, k) {
    return (magnitude * magnitude) / k;
  };

  function repulsiveForce(magnitude, k) {
    return (k * k) / magnitude;
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
    }
  };

  this.applyDisplacement = function(nodeDisplacement) {
    var biggestDisplacement = -1;
    for(var nodeIndex in nodeDisplacement) {
      var node = this.nodesHash[nodeIndex];
      var disp = nodeDisplacement[nodeIndex];
      
      var dispMagnitude = HeyGraph.VectorUtils.magnitude(disp);

      if(dispMagnitude != 0) {

        node.x += (disp.x / dispMagnitude) * Math.min(this.temp, Math.abs(disp.x));
        node.y += (disp.y / dispMagnitude) * Math.min(this.temp, Math.abs(disp.y));

        var xDisp = (disp.x / dispMagnitude) * Math.abs(disp.x);
        var yDisp = (disp.y / dispMagnitude) * Math.abs(disp.y);

        biggestDisplacement = Math.max(biggestDisplacement, Math.abs(xDisp), Math.abs(yDisp));
      }
    }
    return biggestDisplacement;
  }
}

