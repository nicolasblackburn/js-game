import {virtual} from '../client.js';

export const initGameState = virtual(function createGameState(ctx) {
  const player = {
    texture: 'walkcycle_r_0',
    x: 16,
    y: 16,
    vx: 0,
    vy: 0,
    ax: 0,
    ay: 0,
    bbx: 0,
    bby: 0,
    bbw: 16,
    bbh: 16
  };

  const enemies = [];
  ctx.gameState = {
    state: 'load',
    map: 'main',
    player,
    enemies
  };
})

