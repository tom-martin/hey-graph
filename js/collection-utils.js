function contains(container, callback) {
  return find(container, callback) != null;
};

function find(container, callback) {
  for(var index in container) {
    var potential = container[index];
    if(callback.call(potential)) {
      return potential;
    }
  }

  return null;
}

function filter(container, callback) {
  var matches = [];
  for(var index in container) {
    var potential = container[index];
    if(callback.call(potential)) {
      matches.push(potential);
    }
  }

  return matches;
}

function reduce(container, callback, initial) {
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
}
