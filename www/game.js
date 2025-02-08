import {virtual} from "./client.js";

const load = virtual(async function load() {
	const ctx = initContext();
	const game = initGame(ctx);

	window.addEventListener("pointercancel", event => pointerCancel(event, game, ctx));
	window.addEventListener("pointerdown", event => pointerDown(event, game, ctx));
	window.addEventListener("pointerenter", event => pointerEnter(event, game, ctx));
	window.addEventListener("pointerleave", event => pointerLeave(event, game, ctx));
	window.addEventListener("pointermove", event => pointerMove(event, game, ctx));
	window.addEventListener("pointerout", event => pointerOut(event, game, ctx));
	window.addEventListener("pointerover", event => pointerOver(event, game, ctx));
	window.addEventListener("pointerup", event => pointerUp(event, game, ctx));
	window.addEventListener("resize", event => resize(event, game, ctx));
	window.addEventListener("visibilitychange", event => visibilityChange(event, game, ctx));

	(function updateFrame () {
		update(game, ctx);
		requestAnimationFrame(updateFrame);
	})();

});

const initContext = virtual(function initContext() {
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
});

const initGame = virtual(function initGame(ctx) {
	return {
		state: "load"
	};
})

const update = virtual(function update(game, ctx) {
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

${hello("World")}
`.trim();

	view.innerHTML = gfx; 
});

const hello = virtual(function hello(value) {
	return `Hello ${value}`;
});

const pointerCancel = virtual(function pointerCancel(event, game, ctx) {
});

const pointerDown = virtual(function pointerDown(event, game, ctx) {
});

const pointerEnter = virtual(function pointerEnter(event, game, ctx) {
});

const pointerLeave = virtual(function pointerLeave(event, game, ctx) {
});

const pointerMove = virtual(function pointerMove(event, game, ctx) {
});

const pointerOut = virtual(function pointerOut(event, game, ctx) {
});

const pointerOver = virtual(function pointerOver(event, game, ctx) {
});

const pointerUp = virtual(function pointerUp(event, game, ctx) {
});

const resize = virtual(function resize(event, game, ctx) {
});

const visibilityChange = virtual(function visibilityChange(event, game, ctx) {
});

window.addEventListener("load", load);

