import {virtual} from "./devClient.js";

export function initContext() {
	const game = document.createElement('div');
	game.setAttribute('class', 'game');

	const view = document.createElement('pre');
	view.setAttribute('class', 'view');

	game.append(view);
	document.body.append(game);

	return {
		game,
		view
	};
}

export function initState(ctx) {
}

export function load() {
	const ctx = _initContext();
	const state = _initState(ctx);
	(function updateFrame () {
		_update(state, ctx);
		requestAnimationFrame(updateFrame);
	})();
}

export function update(state, ctx) {
	const {view} = ctx;

	const gfx = `
######..######
#............#
#............#
#............#
.......$......
#............#
#............#
#............#
######..######

(px: pixel, sx: subpixel, s: second, f: frame)
256 sx = 1 px
64 f = 1 s
8 px / s
= (2048 / 64) sx / f
= 32 sx / f
`.trim();

	view.innerHTML = gfx; 
}

const _load = virtual(load);
const _initState = virtual(initState);
const _initContext = virtual(initContext);
const _update = virtual(update);

window.addEventListener("load", _load);
