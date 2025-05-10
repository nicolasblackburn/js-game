import {clearAnimation, setAnimation} from './animations.js';
import {getLayer, getMap, isSolid, mapCollides} from './maps.js';
import {createEntity} from './gameState.js';
import {showScreen} from './screens.js';
import {addEventListener} from './events.js';

export function initStates(ctx) {
  ctx.states = {
    heroNormalState,
    entityHurtState,
    seekState
  };
}

function heroNormalState(ctx, entity) {
  const {gamepad} = ctx;

  if (entity.enemyCollision) { 
    entity.health--;

    if (entity.health <= 0) {
      // Reset game state
      
      // Pause game
      ctx.paused = true;

      // Display game over screen
      showScreen(ctx, 'gameover');

      // Go to game over state
      return ['set', 'gameOverState'];

    } else {

      const [vx, vy] = [
        [-1, 0],
        [0, -1],
        [1, 0],
        [0, 1]
      ][entity.dir ?? 0];

      entity.vx = vx;
      entity.vy = vy;

      entity.enemyCollision = null;
      entity.monsterCollisionDisabled = true;
      entity.hurtCountdown = 10;

      // Push hurt state
      return ['push', 'entityHurtState'];
    }

  } else if (entity.invincibleCountdown) {

    entity.invincibleCountdown--;

    if (entity.invincibleCountdown <= 0) {
      entity.monsterCollisionDisabled = false;
      clearAnimation(ctx, entity, 1);
      entity.visible = true;
    }

  }

  entity.vx = gamepad.axes[0];
  entity.vy = gamepad.axes[1];

  const {weapon} = ctx.gameState;
  weapon.x = entity.x;
  weapon.y = entity.y;
  
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

function entityHurtState(ctx, entity) {
  entity.hurtCountdown--;
  if (entity.hurtCountdown <= 0) {
    entity.invincibleCountdown = 60;
    setAnimation(ctx, entity, 'blink', 1);
    return 'terminate';
  }
}

function seekState(ctx, entity) {
  const player = ctx.gameState.player;
  const map = getMap(ctx);

  const {tilewidth, tileheight} = map;
  const halftilewidth = tilewidth / 2;
  const halftileheight = tileheight / 2;
    
  const entitygridx = entity.x / tilewidth | 0;
  const entitygridy = entity.y / tileheight | 0;

  const playergridx = player.x / tilewidth | 0;
  const playergridy = player.y / tileheight | 0;

  const newx = entity.ax + entity.vx + entity.x;
  const newy = entity.ay + entity.vy + entity.y;

  const {bbx, bby, bbw, bbh} = entity;
  const cantMove = mapCollides(ctx, newx + bbx, newy + bby, bbw, bbh);
  
  if (!entity.target || cantMove || (entity.vx === 0 && entity.vy === 0) || entity.target.distance <= 0) {
    
    if (entity.target) {
      //entity.x = entity.target.x;
      //entity.y = entity.target.y;
    }

    do {
      const dir = Math.random() * 4 | 0;

      let [vx, vy] = [
        [1, 0],
        [0, 1],
        [-1, 0],
        [0,-1]
      ][dir];

      entity.origin = {
        x: (entitygridx + 0.5)  * tilewidth,
        y: (entitygridy + 0.5) * tileheight
      };

      entity.target = {
        x: (entitygridx + vx + 0.5) * tilewidth,
        y: (entitygridy + vy + 0.5) * tileheight
      };

      entity.target.distance = 2 * ((vx * tilewidth) ** 2 + (vy * tileheight) ** 2) ** 0.5;
      entity.target.increment = 0.5 * (vx ** 2 + vy ** 2) ** 0.5;

      entity.vx = 0.5 * vx;
      entity.vy = 0.5 * vy;

    } while (isSolid(ctx, entity.target.x, entity.target.y));

  } else {
    entity.target.distance -= entity.target.increment;
  }

  // If change direction
  // then update target
  //const seekchance = entity.seekchance ?? 0.25;
  //if (Math.random() < seekchance) {

  //}
} 

export function updateStates(ctx) {
  //console.log('start');
  const {gameState} = ctx;
  const {player, enemies} = gameState;

  const nodes = [player, ...enemies];
  for (const node of nodes) {
    for (const state of node.states ?? []) {
      const top = state.pop();
      const fn = ctx.states?.[top];
      //console.log('exec', top);
      const result = fn?.(ctx, node);
      if (!result || result === 'continue') {
        state.push(top);
      } else if (Array.isArray(result)) {
        const [action, name] = result;
        if (action === 'push') {
          state.push(top);
        }
        if (action === 'push' || action === 'set') {
          state.push(name);
        }
      }
    }

    node.states = node.states?.filter(stack => stack.length) ?? [];
  }

}


