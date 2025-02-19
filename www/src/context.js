import {virtual} from '../client.js';
import {initEvents} from './events.js';
import {initLoader} from './loader.js';
import {initTouch} from './touch.js';
import {createSVGElement} from './svg.js';

export const createContext = virtual(function createContext() {
	const game = document.createElement('div');
	game.setAttribute('class', 'game');

	const canvas = createSVGElement('svg', {
		'class': 'canvas',
		width: window.innerWidth,
		height: window.innerHeight
	});
	
	game.append(canvas);

	const view = createSVGElement('svg', {
		'class': 'view',
		width: window.innerWidth,
		height: window.innerWidth * 9 / 10,
		viewBox: `0 0 ${16 * 10} ${16 * 9}`
	});

	canvas.append(view);

	const defs = createSVGElement('defs');
	view.append(defs);

	const background = createSVGElement('g', {
		'class': 'background'
	});
	view.append(background);

	// Background tiles
	const tiles = [];
	for (let i = 0; i < 10 * 11; i++) {
		const x = (i % 11) * 16;
		const y = (i / 11 | 0) * 16;
		const width = 16;
		const height = 16;
		const href = '#tex0';
		const tile = createSVGElement('use', {
			x,
			y,
			width,
			height,
			href
		});

		tiles.push(tile);
		background.append(tile);
	}

	const spritesContainer = createSVGElement('g', {
		'class': 'sprites'
	});
	view.append(spritesContainer);

	const sprites = [];
	for (let i = 0; i < 64; i++) {
		const display = i ? 'none' : '';
		const sprite = createSVGElement('circle', {
			cx: 8,
			cy: 8,
			r: 8,
			fill: '#000'
		}, {
			display
		});

		sprites.push(sprite);
		spritesContainer.append(sprite);
	}

	const border = createSVGElement('rect', {
		width: 16 * 10,
		height: 16 * 9,
		stroke: '#000',
		fill: 'none'
	});
	view.append(border);

	document.body.append(game);

	const ctx = {
		game,
		canvas,
		view,
		defs,
		background,
		tiles,
		sprites,
	};

	initLoader(ctx);
	initEvents(ctx);
	initTouch(ctx);

	return ctx;
});

