import {createContext} from './src/context.js';
import {loadResources, reload, getTextureId} from './src/loader.js';
import {addEventListeners, addEventListener} from './src/events.js';
import {setAttributes} from './src/svg.js';
import {getMap, getMapProperty, renderMap} from './src/map.js';

const EPSILON = 100 * Number.EPSILON;
const SQRT_1_2 = 1 / 2**0.5

const load = devEnv?.virtual(async function load() {
	const ctx = createContext();

	addEventListeners(ctx);

	devEnv?.addReloadListener(url => reload(ctx, url));
	addEventListener(ctx, 'resize', resize.bind(null, ctx));

  const urls = await (await fetch('manifest.json')).json();
	await loadResources(ctx, urls);

	(function updateFrame(currentTime) {
		update(ctx, currentTime);
		requestAnimationFrame(updateFrame);
	})();
 
});

const resize = devEnv?.virtual(function resize(ctx, event) {
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

const update = devEnv?.virtual(function update(ctx, currentTime = 0) {
  ctx.currentTime = currentTime;
  ctx.fixedTimeLeft += ctx.currentTime - ctx.lastTime;

  updateStates(ctx);
  updateAnimations(ctx);

  while (ctx.fixedTimeLeft > 0) {
    fixedUpdate(ctx);
    ctx.fixedTimeLeft -= ctx.fixedTimeStepDuration;
  }
  
  render(ctx);

  ctx.lastTime = currentTime;

});

function updateStates(ctx) {
  const {gameState} = ctx;
  const {player, enemies} = gameState;

  const nodes = [gameState, player, ...enemies];
  for (const node of nodes) {
    for (const state of node.states ?? []) {
      const top = state.pop();
      const result = top(ctx, node);
      if (result === 'continue') {
        top.push(top);
      } else if (result) {
        const [action, name] = result;
        const coroutine = ctx.coroutines[name];
        if (action === 'push') {
          state.push(top);
        }
        if (coroutine && (action === 'push' || action === 'replace')) {
          state.push(coroutine);
        }
      }
    }

    node.states = node.states?.filter(stack => !stack.length) ?? [];
  }
}

const updateAnimations = devEnv?.virtual(function updateAnimations(ctx) {
  const {gamepad, gameState, currentTime, lastTime} = ctx;
  const {player, enemies} = gameState;

  if (gamepad.axes[0] === 0) {
    if (player.animations[0].name.slice(-2) === '_r') {
      player.animations[0].name = 'hero_idle_r';
    } else if (player.animations[0].name.slice(-2) === '_l') {
      player.animations[0].name = 'hero_idle_l';
    }

  } else if (gamepad.axes[0] > 0) {
    player.animations[0].name = 'hero_walkcycle_r';

  } else if (gamepad.axes[0] < 0) {
    player.animations[0].name = 'hero_walkcycle_l';

  }

  // Calculate deltaTime
  const deltaTime = currentTime - lastTime;

  const entities = [player, ...enemies];

  for (const entity of entities) {
    const animations = entity.animations ?? [];
    for (const state of animations) {
      state.time += deltaTime;
      const animation = getAnimation(ctx, state.name);
      if (animation) {
        if (animation.loop) {
          state.time = state.time % animation.duration;
        } 
        applyAnimation(entity, animation, state.time);
      }
    }
  }

});

const getAnimation = devEnv?.virtual(function getAnimation(ctx, name) {
  return ctx.animations[name];
});

const applyAnimation = devEnv?.virtual(function applyAnimation(target, animation, time) {
  const {duration, frames, properties} = animation;

  let prevframe = 0;
  let frame = 0;

  if (time >= duration) {
    frame = frames.length - 1;
    prevframe = frame;
  } else {

    // Find frame before and after. Some 
    // optimizations like searching from the last
    // frame index or using binary search could 
    // be more efficient but is it really needed?
    while (frames[frame] < time) {
      frame++;
      prevframe = frame - 1;
    }
  }
  
  // These will be used for interpolation.
  const t = time - frames[prevframe];
  const d = (frames[frame] - frames[prevframe]) || 1;
  const a = (d - t) / d;
  const b = t / d;

  for (let {path, values} of properties) {
    let node = target;
    while (path.length > 1) {
      node = node[path.unshift()] ?? {};
    }

    if (typeof values[prevframe] === 'number') {
      target[path[0]] = a * values[prevframe] + b * values[frame];
    } else {
      target[path[0]] = values[prevframe];
    }
  }
});

const fixedUpdate = devEnv?.virtual(function fixedUpdate(ctx) {
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

const isSolid = devEnv?.virtual(function isSolid(ctx, x, y) {
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

const mapCollides = devEnv?.virtual(function mapCollides(ctx, bbx, bby, bbw, bbh, map) {
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

export function feq(x, y) {
  return Math.abs(x - y) < Number.EPSILON;
}

export function flt(x, y) {
  return x < y && !feq(x, y);
}

export function flte(x, y) {
  return x < y || feq(x, y);
}

export function fgt(x, y) {
  return x > y && !feq(x, y);
}

export function fgte(x, y) {
  return x > y || feq(x, y);
}

const updateMovement = devEnv?.virtual(function updateMovement(ctx, entity) {

  const {vx, vy} = entity;

  if (!feq(vx, 0) && !feq(vy, 0)) {
    updateMovementXY(ctx, entity);

  } else if (!feq(vx, 0)) {
    updateMovementX(ctx, entity);

  } else if (!feq(vy, 0)) {
    updateMovementY(ctx, entity);

  }

});

const updateMovementXY = devEnv?.virtual(function updateMovementXY(ctx, entity) {

  const map = getMap(ctx);
  const {tileheight, tilewidth} = map;
  let {x, y, vx, vy, bbx, bby, bbw, bbh} = entity;

  if (!mapCollides(ctx, x + bbx + vx, y + bby + vy, bbw, bbh)) {
    return true;

  }

  // Check if it can do a hook
  const snapvxplus = tilewidth - (x + bbx) % tilewidth;
  const snapvxneg = -(x + bbx + bbw) % tilewidth;
  const snapvyplus = tileheight - (y + bby) % tileheight;
  const snapvyneg = -(y + bby + bbh) % tileheight;

  if (flt(0, snapvxplus) && 
    flte(snapvxplus, vx) &&
    !mapCollides(ctx, x + bbx + snapvxplus, y + bby + vy, bbw, bbh)) {

    entity.vx = snapvxplus;
    return true;

  } else if (fgte(vx, snapvxneg) &&
    fgt(snapvxneg, 0) &&
    !mapCollides(ctx, x + bbx + snapvxneg, y + bby + vy, bbw, bbh)) {

    entity.vx = snapvxneg;
    return true;

  } else if (flt(0, snapvyplus) &&
    flte(snapvyplus, vy) &&
    !mapCollides(ctx, x + bbx + vx, y + bby + snapvyplus, bbw, bbh)) {

    entity.vy = snapvyplus;
    return true;

  } else if (fgte(vy, snapvyneg) &&
    fgt(snapvyneg, 0) &&
    !mapCollides(ctx, x + bbx + vx, y + bby + snapvyneg, bbw, bbh)) {

    entity.vy = snapvyneg;
    return true;

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

const updateMovementX = devEnv?.virtual(function updateMovementX(ctx, entity) {

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

const updateMovementY = devEnv?.virtual(function updateMovementY(ctx, entity) {

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

const render = devEnv?.virtual(function render(ctx) {
  renderMap(ctx);
  renderSprites(ctx);
});

const renderSprites = devEnv?.virtual(function renderSprites(ctx) {
  const {player, enemies, map} = ctx.gameState;
  const {sprites} = ctx.dom;
  const entities = [player, ...enemies];

  for (let i = 0; i < Math.min(sprites.length, entities.length); i++) {
    const entity = entities[i];
    const sprite = sprites[i];
    const {texture, x, y, px, py, scalex, scaley} = entity;
    setAttributes(sprite, {
      href: getTextureId(ctx, texture),
      transform: `translate(${
        x - map.x - px
      },${
        y - map.y - py
      })`
    });
  }

});

window.addEventListener('load', load);

