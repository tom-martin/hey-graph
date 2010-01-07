hey_graph.vectorUtils = hey_graph.vectorUtils || {};

hey_graph.vectorUtils.differenceVector = function(vectorA, vectorB) {
  var diff = {};
  diff.x = vectorA.x - vectorB.x;
  diff.y = vectorA.y - vectorB.y;
  return diff;
}

hey_graph.vectorUtils.magnitude = function(vector) {
  return Math.sqrt((vector.x * vector.x) + (vector.y * vector.y));
};

