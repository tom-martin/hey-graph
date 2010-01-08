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

