import {getTextureId, pathDirname, pathJoin} from './loader.js';
import {setAttributes} from './svg.js';

export function getMapProperty(map, pname) {
  return map?.properties?.find?.(({name}) => name === pname)?.value;
}

export function getMap(ctx, name) {
  const {gameState, maps} = ctx;
  const map = maps[name ?? gameState.map.current];
  return map;
}

export function renderMap(ctx, map) {
  map = map ?? getMap(ctx);
  
  const {dom, gameState, textures, view} = ctx;
  const {background, tiles} = dom;
  
  const layer = map.layers[gameState.map.layer];
  const mapData = layer.data;
  const tileset = map.tilesets[0].tiles;
  
  const viewx = -gameState.map.x % view.tilewidth;
  const viewy = -gameState.map.y % view.tileheight;
  const mapx = gameState.map.x / view.tilewidth | 0;
  const mapy = gameState.map.y / view.tileheight | 0;

  setAttributes(background, {
    transform: `translate(${viewx}, ${viewy})`
  });

  for (let i = 0; i < tiles.length; i++) {
    const tile = tiles[i];
    const x = mapx + (i % (view.width + 1));
    const y = mapy + (i / (view.width + 1) | 0);
    if (x < 0 || y < 0 || x >= layer.width || y >= layer.height) {
      setAttributes(tile, {
        href: getTextureId(ctx, 'EMPTY')
      });
    } else {
      const index = y * map.width + x;
      let name = 'EMPTY';
      if (tileset[mapData[index]]) {
        name = pathJoin(
          pathDirname(map.url),
          tileset[mapData[index]]?.image
        );
      }
      setAttributes(tile, {
        href: getTextureId(ctx, name)
      });
    }
  }
}

