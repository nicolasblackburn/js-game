import {virtual, virtualClass} from "./client.js";

export async function load() {
	const ctx = _initContext();
	const game = _initGame(ctx);

	window.addEventListener("pointercancel", event => _pointerCancel(event, game, ctx));
	window.addEventListener("pointerdown", event => _pointerDown(event, game, ctx));
	window.addEventListener("pointerenter", event => _pointerEnter(event, game, ctx));
	window.addEventListener("pointerleave", event => _pointerLeave(event, game, ctx));
	window.addEventListener("pointermove", event => _pointerMove(event, game, ctx));
	window.addEventListener("pointerout", event => _pointerOut(event, game, ctx));
	window.addEventListener("pointerover", event => _pointerOver(event, game, ctx));
	window.addEventListener("pointerup", event => _pointerUp(event, game, ctx));
	window.addEventListener("resize", event => _resize(event, game, ctx));
	window.addEventListener("visibilitychange", event => _visibilityChange(event, game, ctx));

	(function updateFrame () {
		_update(game, ctx);
		requestAnimationFrame(updateFrame);
	})();

}


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
	return {
		state: "load",
	};
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

${game.test.sayHello()}
`.trim();

	view.innerHTML = gfx; 
}

export function pointerCancel(event, game, ctx) {
}

export function pointerDown(event, game, ctx) {
}

export function pointerEnter(event, game, ctx) {
}

export function pointerLeave(event, game, ctx) {
}

export function pointerMove(event, game, ctx) {
}

export function pointerOut(event, game, ctx) {
}

export function pointerOver(event, game, ctx) {
}

export function pointerUp(event, game, ctx) {
}

export function resize(event, game, ctx) {
}

export function visibilityChange(event, game, ctx) {
}

const _load = virtual(load);
const _initContext = virtual(initContext);
const _initGame = virtual(initGame);
const _pointerCancel = virtual(pointerCancel);
const _pointerDown = virtual(pointerDown);
const _pointerEnter = virtual(pointerEnter);
const _pointerLeave = virtual(pointerLeave);
const _pointerMove = virtual(pointerMove);
const _pointerOut = virtual(pointerOut);
const _pointerOver = virtual(pointerOver);
const _pointerUp = virtual(pointerUp);
const _resize = virtual(resize);
const _visibilityChange = virtual(visibilityChange);
const _update = virtual(update);

window.addEventListener("load", _load);

