import {EPSILON} from './constants.js';

export function getMapProperty(map, pname) {
  return map?.properties?.find?.(({name}) => name === pname)?.value;
}

export function getMap(ctx, name) {
  const {scene, maps} = ctx;
  const map = maps[name ?? scene.map.current];
  return map;
}

export function getLayer(ctx, map, layerIndex) {
  const {scene} = ctx;
  const mapData = getMap(ctx, map);
  const layer = mapData.layers[layerIndex] ?? mapData.layers[scene.map.layer];
  return layer;
}

export function mapCollides(ctx, bbx, bby, bbw, bbh, map) {
  if (map === undefined) {
    map = getMap(ctx);
  }
  const {tileheight, tilewidth} = map;

  // For each sensor point (four corners of collision
  // rectangle plus extra vertexes to ensure the map's 
  // tile size is bigger than sensors distance), 
  // check if the sensor hit a solid tile. If that is
  // the case, find the shortest penetration vector 
  // that puts the entity in a non-collision position.

  const startx = bbx;
  const endx = bbx + bbw;
  const starty = bby;
  const endy = bby + bbh;

  // We must remove a small number when checking
  // endpoints because we are dealing with
  // open intervals. If we don't, it will result
  // in false collision when the end positions
  // are aligned to the grid.

  for (let x = startx; x < endx; x += tilewidth) {
    if (isSolid(ctx, x, starty) || isSolid(ctx, x, endy - EPSILON)) {
      return true;
    }
  }

  if (isSolid(ctx, endx - EPSILON, starty) || isSolid(ctx, endx - EPSILON, endy - EPSILON)) {
    return true;
  }

  for (let y = starty + tileheight; y < endy; y += tileheight) {
    if (isSolid(ctx, startx, y) || isSolid(ctx, endx - EPSILON, y)) {
      return true;
    }
  }

  return false;

}

export function isSolid(ctx, x, y) {
  const {gameState} = ctx;
  const map = getMap(ctx);
  const layer = getLayer(ctx);
  const {data, width, height} = layer;
  const {tileheight, tilewidth, tilesets} = map;
  const tilesCollision = tilesets[0].tiles.map(tile => getMapProperty(tile, 'collision'));

  // We could handle interval end cases better 
  // here but, for now we'll just keep using
  // an epsilon because it is simpler.

  const tilex = x / tilewidth | 0;
  const tiley = y / tileheight | 0;

  if (0 <= tilex && tilex < width && 0 <= tiley && tiley < height) {
    // Get tile at x, y
    const tileId = data[width * tiley + tilex];

    // Is it a solid tile?
    return !!tilesCollision[tileId];

  } else {
    return false;

  }
}

