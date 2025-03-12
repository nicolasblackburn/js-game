import {addReloadListener, listDir, printInfo, virtual} from './client.js';
import {createContext} from './src/context.js';
import {loadResources, reload, getTextureId} from './src/loader.js';
import {addEventListeners, addEventListener} from './src/events.js';
import {setAttributes} from './src/svg.js';
import {getMap, getMapProperty, renderMap} from './src/map.js'

const load = virtual(async function load() {
	const ctx = createContext();

	addEventListeners(ctx);

	addReloadListener(url => reload(ctx, url));
	addEventListener(ctx, 'resize', resize.bind(null, ctx));

	await loadResources(ctx, await listDir());

	(function updateFrame(currentTime) {
		update(ctx, currentTime);
		requestAnimationFrame(updateFrame);
	})();
 
});

const resize = virtual(function resize(ctx, event) {
  const {view, dom} = ctx;
  const {canvasSvg, viewSvg} = dom;
  const {innerWidth, innerHeight} = window;
  const width = Math.min(innerWidth, innerHeight * view.width / view.height);
  const height = Math.min(innerHeight, innerWidth * view.height / view.width);
  const x = Math.max(0, (innerWidth - width) / 2);
  const y = Math.max(0, (innerHeight - height) / 2);

  setAttributes(canvasSvg, {
    width: innerWidth,
    height: innerHeight
  });

  setAttributes(viewSvg, {
    x,
    y,
		width,
		height
  });

});

const update = virtual(function update(ctx, currentTime) {
  const deltaTime = !ctx.lastTime ? 0 : currentTime - ctx.lastTime;
  ctx.fixedTimeLeft += deltaTime;

  while (ctx.fixedTimeLeft > 0) {
    fixedUpdate(ctx);
    ctx.fixedTimeLeft -= ctx.fixedTimeStepDuration;
  }
  
  render(ctx);

  ctx.lastTime = currentTime;


  /*
(px: pixel, sx: subpixel, s: second, f: frame)
256 sx = 1 px
64 f = 1 s
8 px / s
= (2048 / 64) sx / f
= 32 sx / f
*/
});

const fixedUpdate = virtual(function fixedUpdate(ctx) {
  const {gamepad, gameState, view} = ctx;
  const {player, enemies} = gameState;

  player.vx = gamepad.axes[0];
  player.vy = gamepad.axes[1];

  const entities = [player, ...enemies];

  for (const entity of entities) {
    processCollisions(ctx, entity);
    entity.vx += entity.ax;
    entity.vy += entity.ay;
    entity.x += entity.vx;
    entity.y += entity.vy;

    /*
    entity.x += entity.vx;
   
    if (checkCollisions(ctx, entity)) {
      entity.x -= entity.vx;
    }

    entity.y += entity.vy;
    
    if (checkCollisions(ctx, entity)) {
      entity.y -= entity.vy;
    }
    */

  }

  const map = getMap(ctx);
  const layer = map.layers[gameState.map.layer];
  const layerwidth = layer.width * map.tilewidth;
  const layerheight = layer.height * map.tileheight;
  const viewwidth = view.width * view.tilewidth;
  const viewheight = view.height * view.tileheight;
  const midpointx = (viewwidth - layerwidth) / 2;
  const midpointy = (viewheight - layerheight) / 2;
  const lowboundx = 0;
  const upboundx = layer.width * map.tilewidth - viewwidth;
  const lowboundy = 0;
  const upboundy = layer.height * map.tileheight - viewheight;
  gameState.map.x = Math.min(Math.max(lowboundx, player.x - viewwidth / 2), upboundx);
  gameState.map.y = Math.min(Math.max(lowboundy, player.y - viewheight / 2), upboundy);

});

function isSolid(ctx, x, y) {
  const {gameState} = ctx;
  const map = getMap(ctx);
  const layer = map.layers[gameState.map.layer];
  const {data, width, height} = layer;
  const {tileheight, tilewidth, tilesets} = map;
  const tilesCollision = tilesets[0].tiles.map(tile => getMapProperty(tile, 'collision'));

  const tilex = x / tilewidth | 0;
  const tiley = y / tileheight | 0;

  if (0 <= tilex && tilex < width && 0 <= tiley && tiley < height) {
    // Get tile at x, y
    const tileId = data[width * tiley + tilex];

    // Is it a solid tile?
    return tilesCollision[tileId];

  } else {
    return false;

  }
}

function collides(ctx, entity, x, y) {
  const map = getMap(ctx);
  const {tileheight, tilewidth} = map;
  let {bbx, bby, bbw, bbh} = entity;

  // For each sensor point (four corners of collision
  // rectangle plus extra vertexes to ensure the map's 
  // tile size is bigger than sensors distance), 
  // check if the sensor hit a solid tile. If that is
  // the case, find the shortest penetration vector 
  // that puts the entity in a non-collision position.
  
  const startx = x + bbx;
  const endx = x + bbx + bbh;
  const starty = y + bby;
  const endy = y + bby + bby;

  for (let x = startx; x < endx; x += tilewidth) {
    if (isSolid(ctx, x, starty) || isSolid(ctx, x, endy)) {
      return true;
    }
  }

  if (isSolid(ctx, endx, starty) || isSolid(ctx, endx, endy)) {
    return true;
  }

  for (let y = starty + tileheight; y < endy; y += tileheight) {
    if (isSolid(ctx, startx, y) || isSolid(ctx, endx, y)) {
      return true;
    }
  }

  return false;

}

const processCollisions = virtual(function checkCollisions(ctx, entity) {
  const map = getMap(ctx);
  const {tileheight, tilewidth} = map;
  let {x, y, vx, vy, bbx, bby, bbw, bbh} = entity;

  //printInfo(collides(ctx, entity, x, y));
  /*
  const xn = 2 ** Math.max(1, Math.ceil(Math.log(bbw / tilewidth) / Math.LN2));
  const yn = 2 ** Math.max(1, Math.ceil(Math.log(bbh / tileheight) / Math.LN2));

  const dx = bbw / xn;
  const dy = bbh / yn;
  */

  /*
  let newx = x + vx;
  let newy = y + vy;


  const solidl = isSolid(ctx, newx + bbx, y);
  const solidr = isSolid(ctx, newx + bbx + bbw, y);
  let solidtl = isSolid(ctx, newx + bbx, y + bby);
  let solidtr = isSolid(ctx, newx + bbx + bbw, y + bby);
  let solidbl = isSolid(ctx, newx + bbx, y + bby + bbh);
  let solidbr = isSolid(ctx, newx + bbx + bbw, y + bby + bbh);

  if (solidtl || solidl || solidbl) {
    if (vx < 0) {
      vx += -(newx + bbx) % tilewidth + tilewidth;
      newx = x + vx;
    }
  } else if (solidtr || solidr || solidbr) {
    if (vx > 0) {
      vx += -(newx + bbx + bbw) % tilewidth;
      newx = x + vx;
    }
  }

  newy = y + vy;

  const solidt = isSolid(ctx,
    newx,
    newy + bby
  );
  const solidb = isSolid(ctx, 
    newx,
    newy + bby + bbh
  );
  solidtl = isSolid(ctx, newx + bbx, newy + bby);
  solidtr = isSolid(ctx, newx + bbx + bbw, newy + bby);
  solidbl = isSolid(ctx, newx + bbx, newy + bby + bbh);
  solidbr = isSolid(ctx, newx + bbx + bbw, newy + bby + bbh);


  if (solidtl || solidt || solidtr) {
    if (vy < 0) {
      vy += -(newy + bby) % tileheight + tileheight;
    }
  } else if (solidbl || solidb || solidbr) {
    if (vy > 0) {
      vy += -(newy + bby + bbh) % tileheight;
    }
  }

  entity.vx = vx;
  entity.vy = vy;
  //*
  printInfo(JSON.stringify({
    solidleft,
    solidright
  }));
  //*/
  
  //entity.x += vx;
  
  /*
  const startx = x + bbx;
  const endx = x + bbx + bbw;
  const starty = y + bby;
  const endy = y + bby + bbh;

  for (let y = starty; y <= endy; y += tileheight) {
    for (let x = startx; x <= endx; x += tilewidth) {
      if (isSolid(ctx, x, y)) {
        return true;
      }
    }
  }

  return false;
  */
});

const render = virtual(function render(ctx) {
  renderMap(ctx);
  renderSprites(ctx);
});

const renderSprites = virtual(function renderSprites(ctx) {
  const {player, enemies, map} = ctx.gameState;
  const {sprites} = ctx.dom;
  const entities = [player, ...enemies];

  for (let i = 0; i < Math.min(sprites.length, entities.length); i++) {
    const entity = entities[i];
    const sprite = sprites[i];
    const {texture, x, y, px, py} = entity;
    setAttributes(sprite, {
      href: getTextureId(ctx, texture),
      transform: `translate(${
        x - map.x - px
      }, ${
        y - map.y - py
      })`
    });
  }

});

window.addEventListener('load', load);

