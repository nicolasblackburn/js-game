import {getMap, getLayer, getMapProperty} from './maps.js';
import {EPSILON, SQRT_1_2} from './constants.js';

export function updateMovement(ctx, entity) {

  const {vx, vy} = entity;

  if (!feq(vx, 0) && !feq(vy, 0)) {
    updateMovementXY(ctx, entity);

  } else if (!feq(vx, 0)) {
    updateMovementX(ctx, entity);

  } else if (!feq(vy, 0)) {
    updateMovementY(ctx, entity);

  }

}

function updateMovementXY(ctx, entity) {

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

}

function updateMovementX(ctx, entity) {

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

}

function updateMovementY(ctx, entity) {

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

}

function mapCollides(ctx, bbx, bby, bbw, bbh, map) {
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
    return tilesCollision[tileId];

  } else {
    return false;

  }
}

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


