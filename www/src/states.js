import {setAnimation} from './animations.js';

export function initStates(ctx) {
  ctx.states = {
    heroIdleState
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

    node.states = node.states?.filter(stack => stack.length) ?? [];
  }
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
      'hero_walk_t'
    ][entity.dir];
    setAnimation(ctx, entity, animation);
  } else {
    // No movement
    const animation = [
      'hero_idle_r',
      'hero_idle_d',
      'hero_idle_l',
      'hero_idle_t'
    ][entity.dir];
    setAnimation(ctx, entity, animation);
  } 
} 


