function HeyGraph(canvas, context, graphData, layoutTime) {
  this.canvas = canvas;
  this.context = context;
  this.graphData = graphData;
  this.nodesHash = {};
  this.nodeRenderer = new SimpleNodeRenderer();
  this.running = false;

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
        thisGraph.render();
        timeForLastRender = Math.min(thisGraph.MILLIS_PER_FRAME / 2, new Date().getTime() - preRenderTime);
        console.log("Time for last render was " + timeForLastRender);
      };

      var clearUpdateInt = setInterval(this.update, this.MILLIS_PER_FRAME);
    };
    updater.call();
  };

  this.render = function() {
    var minX = this.layout.layoutBounds.x;
    var minY = this.layout.layoutBounds.y;
    var maxX = this.layout.layoutBounds.x + this.layout.layoutBounds.width;
    var maxY = this.layout.layoutBounds.y + this.layout.layoutBounds.height;

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
      this.context.moveTo(nodeA.x, nodeA.y); // give the (x,y) coordinates
      this.context.lineTo(nodeB.x, nodeB.y);
      this.context.closePath();
      this.context.stroke();
    }
    this.context.restore();
  }
}

