import {listDir, addReloadListener, virtual} from './client.js';
import {createContext} from './src/context.js';
import {loadResources, reload, getTextureId} from './src/loader.js';
import {addEventListeners} from './src/events.js';
import {setAttributes} from './src/svg.js';

const load = virtual(async function load() {
	const ctx = createContext();

	addEventListeners(ctx);

	addReloadListener(url => reload(ctx, url));

	await loadResources(ctx, await listDir());

	(function updateFrame(currentTime) {
		update(ctx, currentTime);
		requestAnimationFrame(updateFrame);
	})();
});

const update = virtual(function update(ctx, currentTime) {
  const deltaTime = !ctx.lastTime ? 0 : currentTime - ctx.lastTime;
  ctx.fixedTimeLeft += deltaTime;

  while (ctx.fixedTimeLeft > 0) {
    fixedUpdate(ctx);
    ctx.fixedTimeLeft -= ctx.fixedTimeStepDuration;
  }

  updateMapTiles(ctx);
  updateSprites(ctx);

  ctx.lastTime = currentTime;
  //ctx.dom.debug.innerText = JSON.stringify(game.player);

  /*
(px: pixel, sx: subpixel, s: second, f: frame)
256 sx = 1 px
64 f = 1 s
8 px / s
= (2048 / 64) sx / f
= 32 sx / f
*/
});

const fixedUpdate = virtual(function fixedUpdate(ctx) {
  const {gamepad} = ctx;
  const {player, enemies} = ctx.gameState;

  player.x += gamepad.axes[0];
  player.y += gamepad.axes[1];

  for (const entity of enemies) {
    entity.vx += entity.ax;
    entity.vy += entity.ay;
    entity.x += entity.vx;
    entity.y += entity.vy;
  }

});

const updateMapTiles = virtual(function updateMapTiles(ctx) {
  const {dom, gameState, maps, textures} = ctx;
  const {tiles} = dom;

  const map = maps[gameState.map];
  const mapData = map.layers[0].data;
  const tileSet = ['floor', 'block'];
  for (let i = 0; i < tiles.length; i++) {
    const tile = tiles[i];
    const x = i % (map.width + 1);
    const y = i / (map.width + 1) | 0;
    if (x >= map.width || y >= map.height) {
      setAttributes(tile, {
        href: getTextureId(ctx, 'EMPTY')
      });
    } else {
      const index = y * map.width + x;
      const name = tileSet[mapData[index]] ?? 'EMPTY';
      setAttributes(tile, {
        href: getTextureId(ctx, name)
      });
    }
  }

});

const updateSprites = virtual(function updateSprites(ctx) {
  const {player, enemies} = ctx.gameState;
  const {sprites} = ctx.dom;
  const spriteStates = [player, ...enemies];

  for (let i = 0; i < Math.min(sprites.length, spriteStates.length); i++) {
    const state = spriteStates[i];
    const sprite = sprites[i];
    const {texture, x, y} = state;
    setAttributes(sprite, {
      href: getTextureId(ctx, texture),
      transform: `translate(${x}, ${y})`
    });
  }

});

window.addEventListener('load', load);

