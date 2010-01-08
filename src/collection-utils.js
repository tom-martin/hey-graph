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
