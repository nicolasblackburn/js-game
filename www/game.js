import {addReloadListener, listDir, printInfo, virtual} from './client.js';
import {createContext} from './src/context.js';
import {loadResources, reload, getTextureId} from './src/loader.js';
import {addEventListeners, addEventListener} from './src/events.js';
import {setAttributes} from './src/svg.js';
import {getMap, getMapProperty, renderMap} from './src/map.js';

const EPSILON = 100 * Number.EPSILON;
const SQRT_1_2 = 1 / 2**0.5

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

});

const fixedUpdate = virtual(function fixedUpdate(ctx) {
  const {gamepad, gameState, view} = ctx;
  const {player, enemies} = gameState;

  player.vx = gamepad.axes[0];
  player.vy = gamepad.axes[1];

  const entities = [player, ...enemies];

  for (const entity of entities) {
    if (Math.abs(entity.ax) < EPSILON) {
      entity.ax = 0;
    }

    if (Math.abs(entity.ay) < EPSILON) {
      entity.ay = 0;
    }

    if (Math.abs(entity.vx) < EPSILON) {
      entity.vx = 0;
    }

    if (Math.abs(entity.vy) < EPSILON) {
      entity.vy = 0;
    }

    updateMovement(ctx, entity);

    entity.vx += entity.ax;
    entity.vy += entity.ay;
    entity.x += entity.vx;
    entity.y += entity.vy;

    if (Math.abs(entity.x - Math.floor(entity.x)) < EPSILON) {
      entity.x = Math.floor(entity.x);
    }

    if (Math.abs(entity.y - Math.floor(entity.y)) < EPSILON) {
      entity.y = Math.floor(entity.y);
    }

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

const isSolid = virtual(function isSolid(ctx, x, y) {
  const {gameState} = ctx;
  const map = getMap(ctx);
  const layer = map.layers[gameState.map.layer];
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
    return tilesCollision[tileId];

  } else {
    return false;

  }
});

const mapCollides = virtual(function mapCollides(ctx, bbx, bby, bbw, bbh, map) {
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

});

function feq(x, y) {
  return Math.abs(x - y) < Number.EPSILON;
}

function flt(x, y) {
  return x < y && !feq(x, y);
}

function flte(x, y) {
  return x < y || feq(x, y);
}

function fgt(x, y) {
  return x > y && !feq(x, y);
}

function fgte(x, y) {
  return x > y || feq(x, y);
}

const updateMovement = virtual(function updateMovement(ctx, entity) {

  const {vx, vy} = entity;

  if (!feq(vx, 0) && !feq(vy, 0)) {
    updateMovementXY(ctx, entity);

  } else if (!feq(vx, 0)) {
    updateMovementX(ctx, entity);

  } else if (!feq(vy, 0)) {
    updateMovementY(ctx, entity);

  }

});

const updateMovementXY = virtual(function updateMovementXY(ctx, entity) {
  
  const map = getMap(ctx);
  const {tileheight, tilewidth} = map;
  let {x, y, vx, vy, bbx, bby, bbw, bbh} = entity;

  if (!mapCollides(ctx, x + bbx + vx, y + bby + vy, bbw, bbh)) {
    return true;

  }

  // Check if it can do a hook

  if (vx > 0 && vy > 0) {
    const vx2 = vx - (x + bbx + vx) % tilewidth;

    if (fgte(vx2, 0) && !mapCollides(ctx, x + bbx + vx2, y + bby + vy, bbw, bbh)) {
      entity.vx = vx2;
      return true;
    }

    const vy2 = vy - (y + bby + vy) % tileheight;
    
    if (fgte(vy2, 0) && !mapCollides(ctx, x + bbx, y + bby + vy2, bbw, bbh)) {
      entity.vy = vy2;
      return true;
    }

  } else if (vx < 0 && vy > 0) {
    const vx2 = vx + (x + bbx + bbw + vx) % tilewidth - tilewidth;

    if (flte(vx2, 0) && !mapCollides(ctx, x + bbx + vx2, y + bby + vy, bbw, bbh)) {
      entity.vx = vx2;
      return true;
    }

    const vy2 = vy - (y + bby + vy) % tileheight;

    if (fgte(vy2, 0)) {
      printInfo({
        x: x + bbx + vx,
        y: y + bby + vy2,
        w: bbw,
        h: bbh
      });
    }
    
    if (fgte(vy2, 0) && !mapCollides(ctx, x + bbx, y + bby + vy2, bbw, bbh)) {
      entity.vy = vy2;
      return true;
    }



  } else if (vx < 0 && vy < 0) {

  } else {

  }

  const collidex = mapCollides(ctx, x + bbx + vx, y + bby, bbw, bbh);
  const collidey = mapCollides(ctx, x + bbx, y + bby + vy, bbw, bbh);

  if (collidex && collidey) {
    entity.vx = 0;
    entity.vy = 0;
    return true;

  } else if (collidex) {
    entity.vx = 0;
    return true;

  } else if (collidey) {
    entity.vy = 0;
    return true;

  }

});

const updateMovementX = virtual(function updateMovementX(ctx, entity) {
  
  let {x, y, vx, bbx, bby, bbw, bbh} = entity;

  if (!mapCollides(ctx, x + bbx + vx, y + bby, bbw, bbh)) {
    return;
  }
  
  let nudgeup = false;
  let nudgedown = false;
  
  // If it is a corner collision nudge

  if (vx > 0) {
    const collidetop = isSolid(ctx, x + bbx + bbw + vx - EPSILON, y + bby, bbw, bbh);
    const collidebottom = isSolid(ctx, x + bbx + bbw + vx - EPSILON, y + bby + bbh - EPSILON, bbw, bbh);
    nudgeup = !collidetop && collidebottom;
    nudgedown = collidetop && !collidebottom;

    if (nudgedown) {
      entity.vx = vx * SQRT_1_2;
      entity.vy = vx * SQRT_1_2;

      return updateMovementXY(ctx, entity);

    } else if (nudgeup) {
      entity.vx = vx * SQRT_1_2;
      entity.vy = -vx * SQRT_1_2;

      return updateMovementXY(ctx, entity);

    }

  } else {
    const collidetop = isSolid(ctx, x + bbx + vx, y + bby, bbw, bbh);
    const collidebottom = isSolid(ctx, x + bbx + vx, y + bby + bbh - EPSILON, bbw, bbh);
    nudgeup = !collidetop && collidebottom;
    nudgedown = collidetop && !collidebottom;

    if (nudgedown) {
      entity.vx = vx * SQRT_1_2;
      entity.vy = -vx * SQRT_1_2;

      return updateMovementXY(ctx, entity);

    } else if (nudgeup) {
      entity.vx = vx * SQRT_1_2;
      entity.vy = vx * SQRT_1_2;

      return updateMovementXY(ctx, entity);

    }
  }

  // Not a corner collision cancel x movement
  entity.vx = 0;

});

const updateMovementY = virtual(function updateMovementY(ctx, entity) {
  
  let {x, y, vy, bbx, bby, bbw, bbh} = entity;

  if (!mapCollides(ctx, x + bbx, y + bby + vy, bbw, bbh)) {
    return;
  }

  let nudgeleft = false;
  let nudgeright = false;
  
  // If it is a corner collision nudge

  if (vy > 0) {
    const collideleft = isSolid(ctx, x + bbx, y + bby + bbh + vy - EPSILON, bbw, bbh);
    const collideright = isSolid(ctx, x + bbx + bbw - EPSILON, y + bby + bbh + vy - EPSILON, bbw, bbh);
    nudgeleft = !collideleft && collideright;
    nudgeright = collideleft && !collideright;

    if (nudgeright) {
      entity.vy = vy * SQRT_1_2;
      entity.vx = vy * SQRT_1_2;

      return updateMovementXY(ctx, entity);

    } else if (nudgeleft) {
      entity.vy = vy * SQRT_1_2;
      entity.vx = -vy * SQRT_1_2;

      return updateMovementXY(ctx, entity);

    }

  } else {
    const collideleft = isSolid(ctx, x + bbx, y + bby + vy, bbw, bbh);
    const collideright = isSolid(ctx, x + bbx + bbw - EPSILON, y + bby + vy, bbw, bbh);
    nudgeleft = !collideleft && collideright;
    nudgeright = collideleft && !collideright;

    if (nudgeright) {
      entity.vy = vy * SQRT_1_2;
      entity.vx = -vy * SQRT_1_2;

      return updateMovementXY(ctx, entity);

    } else if (nudgeleft) {
      entity.vy = vy * SQRT_1_2;
      entity.vx = vy * SQRT_1_2;

      return updateMovementXY(ctx, entity);

    }
  }

  // Not a corner collision cancel y movement
  entity.vy = 0;

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

