function HeyGraph(canvas, context, graphData, layoutTime) {
  this.canvas = canvas;
  this.context = context;
  this.graphData = graphData;
  this.nodesHash = {};

  for(var nodeIndex in graphData.nodes) {
    var currentNode = graphData.nodes[nodeIndex];
    this.nodesHash[currentNode.graphId] = currentNode;
  }

  this.layoutTime = layoutTime;

  this.layoutDone = false;

  this.NODE_WIDTH = 20;


  this.nodeHistoryCounter = 0;

  this.layout = new ForceDirectedLayout(this.graphData, canvas.width, canvas.height, this);

  var thisGraph = this;
  this.start = function() {
    thisGraph.layout.initialLayout();
    thisGraph.preUpdateTime = new Date().getTime();
    var layoutTimeMaxMillis = thisGraph.layoutTime * 1000;
    var updater = function() {
      this.update = function() {
        if(thisGraph.layout.update(1000 / 30) || (layoutTimeMaxMillis && new Date().getTime() - thisGraph.preUpdateTime > layoutTimeMaxMillis)) {
          thisGraph.layoutDone = true;
          clearInterval(clearUpdateInt);
        }
        thisGraph.render();
      };

      var clearUpdateInt = setInterval(this.update, 1000 / 30);
    };
    updater.call();
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
    this.context.save();
    if(!this.layoutDone) {
      context.fillStyle    = '#fff';
      this.context.strokeStyle = "#fff";     
     // context.font         = 'bold 30px sans-serif';
      //context.fillText('Laying out ... ' + (this.layout.layoutProgress * 100) + '%', 5, this.canvas.height - 15);

      var progress = (new Date().getTime() - this.preUpdateTime) / (thisGraph.layoutTime * 1000);
      progress = Math.max(progress, this.layout.layoutProgress);
      this.context.strokeRect(5, this.canvas.height - 30, 100, 10);
      this.context.fillRect(5, this.canvas.height - 30, progress * 100, 10);
    }
    this.context.restore();
  };
}

