import {listDir, addReloadListener, virtual} from './client.js';
import {createContext} from './src/context.js';
import {loadResources, reload} from './src/loader.js';
import {addEventListeners} from './src/events.js';

const load = virtual(async function load() {
	const ctx = createContext();
	const game = createGameState(ctx);

	addEventListeners(game, ctx);

	addReloadListener(url => reload(game, ctx, url));

	await loadResources(game, ctx, await listDir());

	(function updateFrame () {
		update(game, ctx);
		requestAnimationFrame(updateFrame);
	})();

});

const createGameState = virtual(function createGameState(ctx) {
	return {
		state: 'load',
		map: 'main'
	};
})

const update = virtual(function update(game, ctx) {
	const {tiles, textures, sprites} = ctx;
  const map = ctx.maps[game.map];
  const mapData = map.layers[0].data;
  const tileSet = ['floor', 'block'];
  for (let i = 0; i < tiles.length; i++) {
    const tile = tiles[i];
    const x = i % (map.width + 1);
    const y = i / (map.width + 1) | 0;
    if (x >= map.width || y >= map.height) {
      tile.setAttribute('href', textures.EMPTY.getAttribute('id'));
    } else {
      const index = y * map.width + x;
      const name = tileSet[mapData[index]] ?? EMPTY;
      const id = textures[name].getAttribute('id');
      tile.setAttribute('href', '#' + id);
    }
  }

  const x = Number(sprites[0].getAttribute('cx'));
  const y = Number(sprites[0].getAttribute('cy'));
  sprites[0].setAttribute('cx', x + ctx.gamepad.axes[0]);
  sprites[0].setAttribute('cy', y + ctx.gamepad.axes[1]);

	/*
(px: pixel, sx: subpixel, s: second, f: frame)
256 sx = 1 px
64 f = 1 s
8 px / s
= (2048 / 64) sx / f
= 32 sx / f
*/
});

window.addEventListener('load', load);

