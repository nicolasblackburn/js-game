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
    px: 8,
    py: 8,
    bbx: 0,
    bby: 0,
    bbw: 16,
    bbh: 16
  };

  const enemies = [];

  const map = {
    current: 'main',
    x: 0,
    y: 0
  }
  ctx.gameState = {
    state: 'load',
    map,
    player,
    enemies
  };
})

