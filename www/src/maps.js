export function getMapProperty(map, pname) {
  return map?.properties?.find?.(({name}) => name === pname)?.value;
}

export function getMap(ctx, name) {
  const {gameState, maps} = ctx;
  const map = maps[name ?? gameState.map.current];
  return map;
}


