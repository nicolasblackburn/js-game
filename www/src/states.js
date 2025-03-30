import {setAnimation} from './animations.js';
import {getLayer, getMap, isSolid, mapCollides} from './maps.js';
import {createEntity} from './gameState.js';

export function initStates(ctx) {
  ctx.states = {
    gameLoadState,
    heroIdleState,
    seekState
  };
}

export function updateStates(ctx) {
  const {gameState} = ctx;
  const {player, enemies} = gameState;

  const nodes = [gameState, player, ...enemies];
  for (const node of nodes) {
    for (const state of node.states ?? []) {
      const top = state.pop();
      const fn = ctx.states?.[top];
      const result = fn?.(ctx, node);
      if (!result || result === 'continue') {
        state.push(top);
      } else if (Array.isArray(result)) {
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

    node.states = node.states?.filter(stack => stack.length) ?? [];
  }
}

function gameLoadState(ctx, game) {
  const mapData = getMap(ctx);
  const layer = getLayer(ctx);

  for (let i = 0; i < 4; i++) {
    let x;
    let y;
    do { 
      x = mapData.tilewidth * ((Math.random() * (layer.width - 2) | 0) + 1) + 8;
      y = mapData.tileheight * ((Math.random() * (layer.height - 2) | 0) + 1) + 8;
    } while (false);
    game.enemies.push(createEntity({
      texture: 'hero_idle_u_0',
      x,
      y,
      states: [['seekState']]
    }));
  }

  return 'terminate';
}

function heroIdleState(ctx, entity) {
  const {gamepad} = ctx;

  entity.vx = gamepad.axes[0];
  entity.vy = gamepad.axes[1];

  if (entity.vx !== 0 || entity.vy !== 0) {
    const tan = entity.vy / entity.vx;
    if (entity.vx >= 0) {
      if (tan < -1) {
        entity.dir = 3;
      } else if (tan < 1) {
        entity.dir = 0;
      } else {
        entity.dir = 1;
      }
    } else {
      if (tan < -1) {
        entity.dir = 1;
      } else if (tan < 1) {
        entity.dir = 2;
      } else {
        entity.dir = 3;
      }
    }
    const animation = [
      'hero_walk_r',
      'hero_walk_d',
      'hero_walk_l',
      'hero_walk_u'
    ][entity.dir];
    setAnimation(ctx, entity, animation);
  } else {
    // No movement
    const animation = [
      'hero_idle_r',
      'hero_idle_d',
      'hero_idle_l',
      'hero_idle_u'
    ][entity.dir];
    setAnimation(ctx, entity, animation);
  } 
} 

function seekState(ctx, entity) {
  const player = ctx.gameState.player;
  const map = getMap(ctx);
    
  const entitygridx = entity.x / map.tilewidth;
  const entitygridy = entity.y / map.tileheight;

  const playergridx = player.x / map.tilewidth;
  const playergridy = player.y / map.tileheight;

  const newx = entity.ax + entity.vx + entity.x;
  const newy = entity.ay + entity.vy + entity.y;
  const {bbx, bby, bbw, bbh} = entity;
  const cantMove = mapCollides(ctx, newx + bbx, newy + bby, bbw, bbh);

  if (!entity.target || cantMove) {
    //do {
    const dir = Math.random() * 4 | 0;
    let [vx, vy] = [
      [1, 0],
      [0, 1],
      [-1, 0],
      [0,-1]
    ][dir];
    entity.origin = {
      x: entity.x % map.tilewidth + map.tilewidth / 2,
      y: entity.y % map.tileheight + map.tileheight / 2
    };

    entity.target = {
      x: ((entity.x / map.tilewidth | 0) + vx + 0.5) * map.tilewidth,
      y: ((entity.y / map.tileheight | 0) + vy + 0.5) * map.tileheight
    };

    devEnv.printInfo('target', entity.target, isSolid(ctx, entity.target.x, entity.target.y));

    entity.vx = 0.5 * vx;
    entity.vy = 0.5 * vy;
    //} while (isSolid(ctx, entity.target.x, entity.target.y));
  }
  // If change direction
  // then update target
  //const seekchance = entity.seekchance ?? 0.25;
  //if (Math.random() < seekchance) {

  //}

  // If target reached
  // then set idle state
  // else continue
  const distance = 1;

} 

function randomTarget() {
}

