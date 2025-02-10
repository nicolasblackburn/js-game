import {virtual} from "./client.js";

const SVG_NS = "http://www.w3.org/2000/svg";

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
	
	const svg = document.createElementNS(SVG_NS, "svg");
	svg.innerHTML = await (await fetch("assets/spritesheet.svg")).text();
	svg.style.display = "none";

	ctx.game.append(svg);
});

const initContext = virtual(function initContext() {
	const game = document.createElement('div');
	game.setAttribute('class', 'game');

	const view = createSVGElement('svg', {
		'class': 'view',
		"width": window.innerWidth,
		"height": window.innerWidth * 10 / 9,
		"viewBox": `0 0 ${16 * 9} ${16 * 10}`
	});

	const background = createSVGElement("g", {
		'class': 'background'
	});
	view.append(background);

	// Background tiles
	const tiles = [];
	for (let i = 0; i < 10 * 11; i++) {
		const x = (i % 10) * 16;
		const y = (i / 10 | 0) * 16;
		const color = (i + y / 16) % 2 ? "#000" : "#fff";
		const tile = createSVGElement("rect", {
			"x": x,
			"y": y,
			"width": "16",
			"height": "16",
			"fill": color
		});

		tiles.push(tile);
		background.append(tile);
	}
	
	const spritesContainer = createSVGElement("g", {
		'class': 'sprites'
	});
	view.append(spritesContainer);

	const sprites = [];
	for (let i = 0; i < 64; i++) {
		const display = i ? "none" : "";
		const sprite = createSVGElement("circle", {
			"cx": 8,
			"cy": 8,
			"r": 8,
			"fill": "#0c9"
		}, {
			display
		});

		sprites.push(sprite);
		spritesContainer.append(sprite);
	}
	
	const border = createSVGElement("rect", {
		"width": 16 * 9,
		"height": 16 * 10,
		"stroke": "#000",
		"fill": "transparent"
	});
	view.append(border);

	game.append(view);
	document.body.append(game);

	return {
		game,
		view,
		background,
		tiles,
		sprites
	};
});

const initGame = virtual(function initGame(ctx) {
	return {
		state: "load"
	};
})

const update = virtual(function update(game, ctx) {
	const {view} = ctx;

	/*
(px: pixel, sx: subpixel, s: second, f: frame)
256 sx = 1 px
64 f = 1 s
8 px / s
= (2048 / 64) sx / f
= 32 sx / f
*/
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

function createSVGElement(name, attrs = {}, style = {}) {
	const e = document.createElementNS(SVG_NS, name);
	for (const [key, value] of Object.entries(attrs)) {
		e.setAttribute(key, value);
	}
	for (const [key, value] of Object.entries(style)) {
		e.style[key] = value;
	}
	return e;
}

window.addEventListener("load", load);

