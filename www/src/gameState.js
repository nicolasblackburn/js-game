import {getLayer, getMap, isSolid} from './maps.js';
import {setAnimation} from './animations.js';

export function initGameState(ctx) {
  const weapon = createEntity({
    name: 'weapon',
    texture: 'sword',
    //py: 16
  });

  // This is the player
  const player = createEntity({
    name: 'player',
    x: 24,
    y: 24,
    health: 3,
    weapon,
    states: [['heroIdleState']],
    children: [
      weapon
    ]
  });

  const enemies = [];

  const map = {
    name: 'map',
    type: 'tilemap',
    current: 'main',
    layer: 0,
    x: 0,
    y: 0
  }

  const scene = {
    name: 'root',
    map,
    player,
    enemies,
    children: [
      map,
      player,
      {
        name: 'enemies',
        children: enemies
      }
    ]
  };
  
  ctx.scene = scene;
}

export function createEntity(attrs = {}) {
  return {
    visible: true,
    active: true,
    texture: 'EMPTY',
    x: 0,
    y: 0,
    vx: 0,
    vy: 0,
    ax: 0,
    ay: 0,
    px: 8,
    py: 8,
    bbx: -8,
    bby: -8,
    bbw: 16,
    bbh: 16,
    scalex: 1,
    scaley: 1,
    dir: 0,
    animations: [],
    states: [],
    ...attrs
  };
}

export function resetGameState(ctx) {
  const {scene} = ctx;
  const {player, enemies} = scene;
  const map = getMap(ctx);
  const layer = getLayer(ctx);
  const {tilewidth, tileheight} = map;
  const {width, height} = layer;
  const halftilewidth = tilewidth / 2;
  const halftileheight = tileheight / 2;

  player.x = 24;
  player.y = 24;
  player.vx = 0;
  player.vy = 0;
  player.health = 3;
  player.enemyCollision = null;
  player.monsterCollisionDisabled = false;
  player.hurtCountdown = 0;
  player.invincibleCountdown = 0;
  player.states = [['heroNormalState']];

  enemies.splice(0);

  for (let i = 0; i < 4; i++) {
    let x;
    let y;
    do { 
      x = tilewidth * ((Math.random() * (width - 2) | 0) + 1) + halftilewidth;
      y = tileheight * ((Math.random() * (height - 2) | 0) + 1) + halftileheight;
    } while (isSolid(ctx, x, y));

    enemies.push(createEntity({
      name: `enemy${i}`,
      texture: 'hero_idle_u_0',
      x,
      y,
      states: [['seekState']]
    }));
  }
}

