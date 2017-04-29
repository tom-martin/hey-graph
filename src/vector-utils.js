HeyGraph.VectorUtils = HeyGraph.VectorUtils || {};

HeyGraph.VectorUtils.differenceVector = (vectorA, vectorB) => {
  var diff = {};
  diff.x = vectorA.x - vectorB.x;
  diff.y = vectorA.y - vectorB.y;
  return diff;
}

HeyGraph.VectorUtils.magnitude = vector => Math.sqrt((vector.x * vector.x) + (vector.y * vector.y));

