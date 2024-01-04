import config from '../config';

// Key: Encoded position; value: decoded position.
const positionMap = new Map(config.secrets.positionMap);

// Key: Encoded character; value: decoded character.
const characterMap = new Map(config.secrets.characterMap);

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
