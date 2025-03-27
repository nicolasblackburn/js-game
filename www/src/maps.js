export function getMapProperty(map, pname) {
  return map?.properties?.find?.(({name}) => name === pname)?.value;
}

export function getMap(ctx, name) {
  const {gameState, maps} = ctx;
  const map = maps[name ?? gameState.map.current];
  return map;
}

export function getLayer(ctx, map, layerIndex) {
  const {gameState} = ctx;
  const mapData = getMap(ctx, map);
  const layer = mapData.layers[layerIndex] ?? mapData.layers[gameState.map.layer];
  return layer;
}
