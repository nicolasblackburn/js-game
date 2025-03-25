export function initGameState(ctx) {
  const player = {
    texture: 'EMPTY',
    x: 24,
    y: 24,
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
    dir: 0, // 0: r, 1: d, 2: l, 3: t
    animations: [],
    states: [['heroIdleState']]
  };

  const enemies = [];

  const map = {
    current: 'main',
    layer: 0,
    x: 0,
    y: 0
  }
  ctx.gameState = {
    state: 'load',
    map,
    player,
    enemies
  };
}

