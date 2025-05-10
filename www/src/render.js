import {pathDirname, pathJoin} from './loader.js';
import {getMap} from './maps.js';
import {setAttributes} from './svg.js';

export function render(ctx) {
  renderScene(ctx, ctx.gameState.scene);
  const {health} = ctx.gameState.player;
  ctx.dom.health.innerHTML = 'Health: ' + health;
}

function renderScene(ctx, scene) {
  const {map} = ctx.gameState;
  scene.x = -map.x ?? 0;
  scene.y = -map.y ?? 0;
  scene.sx = 1 / (map.sx ?? 1);
  scene.sy = 1 / (map.sy ?? 1);
  scene.r = -(map.r ?? 0);

  let i = 0;
  for (const [node, parent] of iterateNodes(ctx, scene)) {
    updateTransform(node, parent); 
    if (node.texture) {
      renderSprite(ctx, node, i++);
    } else if (node.type === 'tilemap') {
      renderMap(ctx, node);
    }
  }
}

function updateTransform(node, parent) {
  const theta = (node.r ?? 0) * Math.PI / 180;
  const cos = Math.cos(theta);
  const sin = Math.sin(theta);
  const a = (node.sx ?? 1) * cos;
  const b = -(node.sx ?? 1) * sin;
  const c = node.x ?? 0;
  const d = (node.sy ?? 1) * sin;
  const e = (node.sy ?? 1) * cos;
  const f = node.y ?? 0;
  node.transform = [a, b, c, d, e, f];

  if (!parent) {
    node.wtransform = [a, b, c, d, e, f];
  } else {
    const [
      wa = 1, wb = 0, wc = 0, 
      wd = 0, we = 1, wf = 0
    ] = parent.wtransform ?? [];

    const [
      ta = 1, tb = 0, tc = 0, 
      td = 0, te = 1, tf = 0
    ] = node.transform ?? [];

    node.wtransform = [
      wa * ta + wd * td,
      wa * tb + wb * te,
      wa * tc + wb * tf + wc,
      wd * ta + we * td,
      wd * tb + we * te,
      wd * tc + we * tf + wf
    ];
  }

  /*
  (() => {
    const [
      a = 1, b = 0, c = 0,
      d = 0, e = 1, f = 0
    ] = node.wtransform ?? [];

    console.log(node.name + ':\n' + [a, b, c].join() + '\n' + [d, e, f].join());
  })();
  */
}

function* iterateNodes(ctx, node, parent) {
  yield [node, parent];
  for (const child of node.children ?? []) {
    yield* iterateNodes(ctx, child, node);
  }
}

function renderSprite(ctx, entity, i) {
  const {map} = ctx.gameState;
  const {sprites} = ctx.dom;
  const sprite = sprites[i];
  const {texture, px = 0, py = 0, visible} = entity;
  const [
    a = 1, b = 0, c = 0,
    d = 0, e = 1, f = 0
  ] = entity.wtransform ?? [];
  setAttributes(sprite, {
    href: getTextureId(ctx, texture),
    transform: `matrix(${a} ${d} ${b} ${e} ${c} ${f}) translate(${-px} ${-py})`
    //transform: `translate(${c} ${f})`
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


