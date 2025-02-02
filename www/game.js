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

export function initGame(ctx) {
}

export function load() {
	const ctx = _initContext();
	const game = _initGame(ctx);

	window.addEventListener("pointercancel", event => _onPointerCancel(event, game, ctx));
	window.addEventListener("pointerdown", event => _onPointerDown(event, game, ctx));
	window.addEventListener("pointerenter", event => _onPointerEnter(event, game, ctx));
	window.addEventListener("pointerleave", event => _onPointerLeave(event, game, ctx));
	window.addEventListener("pointermove", event => _onPointerMove(event, game, ctx));
	window.addEventListener("pointerout", event => _onPointerOut(event, game, ctx));
	window.addEventListener("pointerover", event => _onPointerOver(event, game, ctx));
	window.addEventListener("pointerup", event => _onPointerUp(event, game, ctx));
	window.addEventListener("resize", event => _onResize(event, game, ctx));
	window.addEventListener("visibilitychange", event => _onVisibilityChange(event, game, ctx));

	(function updateFrame () {
		_update(game, ctx);
		requestAnimationFrame(updateFrame);
	})();
}

export function update(game, ctx) {
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

export function onPointerCancel(event, game, ctx) {
}

export function onPointerDown(event, game, ctx) {
}

export function onPointerEnter(event, game, ctx) {
}

export function onPointerLeave(event, game, ctx) {
}

export function onPointerMove(event, game, ctx) {
}

export function onPointerOut(event, game, ctx) {
}

export function onPointerOver(event, game, ctx) {
}

export function onPointerUp(event, game, ctx) {
}

export function onResize(event, game, ctx) {
}

export function onVisibilityChange(event, game, ctx) {
}

const _load = virtual(load);
const _initContext = virtual(initContext);
const _initGame = virtual(initGame);
const _update = virtual(update);
const _onPointerCancel = virtual(onPointerCancel);
const _onPointerDown = virtual(onPointerDown);
const _onPointerEnter = virtual(onPointerEnter);
const _onPointerLeave = virtual(onPointerLeave);
const _onPointerMove = virtual(onPointerMove);
const _onPointerOut = virtual(onPointerOut);
const _onPointerOver = virtual(onPointerOver);
const _onPointerUp = virtual(onPointerUp);
const _onResize = virtual(onResize);
const _onVisibilityChange = virtual(onVisibilityChange);

window.addEventListener("load", _load);

