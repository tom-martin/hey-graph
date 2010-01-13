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
    var x = node.x - (img.width / 2);
    var y = node.y - (img.height / 2);

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
    if(node.graphImageUrl && this.imageCache[node.graphImageUrl] != 'placeholder') {
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
          graph.render.call(graph);
        };
      };
      // Once it's loaded draw the image on the canvas.
      img.addEventListener('load', imageCallback(node), false);
      
      img.src = node.graphImageUrl;
    }

    context.strokeStyle = "#000";      
    context.fillStyle = "#FFF";
    context.beginPath();
    context.arc(node.x, node.y, this.NODE_WIDTH / 2, 0, Math.PI*2, true);
    context.closePath();
    context.stroke();
    context.fill();
  }

  if( typeof(context.fillText)=='function' &&
      node.graphCaption) {
    context.fillStyle = "#FFF";
    context.font = 'bold 30px sans-serif';
    var textMetrics = context.measureText(node.graphCaption);
    context.fillText(node.graphCaption, node.x - (textMetrics.width / 2), node.y + 30 + (nodeHeight / 2));
  }
  context.restore();
};
