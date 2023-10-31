// Key: Encoded position; value: decoded position.
const positionMap = new Map([
  [8, 0],
  [18, 1],
  [26, 2],
  [3, 3],

  [5, 4],
  [28, 5],
  [23, 6],
  [13, 7],

  [46, 8],
  [53, 9],
  [35, 10],
  [56, 11],

  [38, 12],
  [42, 13],
  [60, 14],
  [59, 15],
]);

// Key: Encoded character; value: decoded character.
const characterMap = new Map([
  ['g', 0],
  ['d', 0],
  ['p', 0],
  ['T', 0],
  ['A', 0],
  ['M', 0],
  ['y', 1],
  ['B', 1],
  ['Z', 1],
  ['I', 1],
  ['n', 1],
  ['s', 1],
  ['m', 2],
  ['h', 2],
  ['J', 2],
  ['f', 2],
  ['Y', 2],
  ['C', 3],
  ['w', 3],
  ['j', 3],
  ['k', 3],
  ['a', 3],
  ['b', 4],
  ['v', 4],
  ['i', 4],
  ['o', 4],
  ['t', 4],
  ['q', 5],
  ['x', 5],
  ['H', 5],
  ['R', 5],
  ['D', 5],
  ['E', 6],
  ['W', 6],
  ['l', 6],
  ['Q', 6],
  ['V', 6],
  ['U', 7],
  ['e', 7],
  ['X', 7],
  ['P', 7],
  ['O', 7],
  ['G', 8],
  ['L', 8],
  ['N', 8],
  ['K', 8],
  ['z', 8],
  ['c', 9],
  ['u', 9],
  ['r', 9],
  ['F', 9],
  ['S', 9],
]);

// Key integer; Value array of encoded options;
const intMap = new Map();

characterMap.forEach(function (val, key) {
  const intVal = intMap.get(val) || [];
  intVal.push(key);
  intMap.set(val, intVal);
});

export default {
  positionMap: positionMap,
  characterMap: characterMap,
  intMap: intMap,
};
