export function initGameState(ctx) {
  const player = createEntity({
    x: 24,
    y: 24,
    states: [['heroIdleState']]
  });

  const enemies = [];

  const map = {
    current: 'main',
    layer: 0,
    x: 0,
    y: 0
  }
  ctx.gameState = {
    map,
    player,
    enemies,
    states: [['gameLoadState']]
  };
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
