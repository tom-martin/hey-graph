HeyGraph.CollectionUtils = HeyGraph.CollectionUtils || {};

HeyGraph.CollectionUtils.contains = function(container, callback) {
  return this.find(container, callback) != null;
};

HeyGraph.CollectionUtils.find = (container, callback) => {
  for(var index in container) {
    var potential = container[index];
    if(callback.call(potential)) {
      return potential;
    }
  }

  return null;
};

HeyGraph.CollectionUtils.filter = (container, callback) => {
  var matches = [];
  for(var index in container) {
    var potential = container[index];
    if(callback.call(potential)) {
      matches.push(potential);
    }
  }

  return matches;
};

HeyGraph.CollectionUtils.reduce = (container, callback, initial) => {
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
