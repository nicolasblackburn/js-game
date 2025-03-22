export function initGameState(ctx) {
  const player = {
    texture: 'walkcycle_r_0',
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
    animations: [
      {
        name: "hero_idle_r",
        time: 0,
      }
    ]
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

