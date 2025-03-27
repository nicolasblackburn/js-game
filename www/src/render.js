import {pathDirname, pathJoin} from './loader.js';
import {getMap} from './maps.js';
import {setAttributes} from './svg.js';

export function render(ctx) {
  renderMap(ctx);
  renderSprites(ctx);
}

function renderMap(ctx, map) {
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

function renderSprites(ctx) {
  const {player, enemies, map} = ctx.gameState;
  const {sprites} = ctx.dom;
  const entities = [player, ...enemies];

  for (let i = 0; i < Math.min(sprites.length, entities.length); i++) {
    const entity = entities[i];
    const sprite = sprites[i];
    const {texture, x, y, px, py, scalex, scaley, visible} = entity;
    setAttributes(sprite, {
      href: getTextureId(ctx, texture),
      transform: `translate(${
        x - map.x - px
      },${
        y - map.y - py
      })`
    });

    Object.assign(sprite.style, {
      display: visible ? '' : 'none'
    });
  }

}

export function getTextureId(ctx, name) {
  if (ctx.textures[name]) {
    return '#' + ctx.textures[name].getAttribute('id');
  }
}


