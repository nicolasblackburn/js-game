import {getMap, getLayer, getMapProperty, isSolid, mapCollides} from './maps.js';
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


