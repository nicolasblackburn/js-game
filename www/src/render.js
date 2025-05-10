import {pathDirname, pathJoin} from './loader.js';
import {getMap} from './maps.js';
import {setAttributes} from './svg.js';

export function render(ctx) {
  renderScene(ctx, ctx.gameState.scene);
  const {health} = ctx.gameState.player;
  ctx.dom.health.innerHTML = 'Health: ' + health;
}

function renderScene(ctx, scene) {
  let i = 0;
  for (const node of iterateNodes(ctx, ctx.gameState.scene)) {
    if (node.texture) {
      renderSprite(ctx, node, i++);
    } else if (node.type === 'tilemap') {
      renderMap(ctx, node);
    }
  }
}

function* iterateNodes(ctx, node) {
  yield node;
  for (const child of node.children ?? []) {
    yield* iterateNodes(ctx, child);
  }
}

function renderSprite(ctx, entity, i) {
  const {map} = ctx.gameState;
  const {sprites} = ctx.dom;
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

function renderMap(ctx, mapNode) {
  const map = getMap(ctx, mapNode.current);

  const {dom, gameState, textures, view} = ctx;
  const {tilemap, tiles} = dom;
  
  const layer = map.layers[gameState.map.layer];
  const mapData = layer.data;
  const tileset = map.tilesets[0].tiles;
  
  const viewx = -gameState.map.x % view.tilewidth;
  const viewy = -gameState.map.y % view.tileheight;
  const mapx = gameState.map.x / view.tilewidth | 0;
  const mapy = gameState.map.y / view.tileheight | 0;

  setAttributes(tilemap, {
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

export function getTextureId(ctx, name) {
  if (ctx.textures[name]) {
    return '#' + ctx.textures[name].getAttribute('id');
  }
}


