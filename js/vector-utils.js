function differenceVector(vectorA, vectorB) {
  var diff = {};
  diff.x = vectorA.x - vectorB.x;
  diff.y = vectorA.y - vectorB.y;
  return diff;
}

function magnitude(vector) {
  return Math.sqrt((vector.x * vector.x) + (vector.y * vector.y));
};

