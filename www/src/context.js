import {addDirListener, addReloadListener, virtual} from '../client.js';
import {createSVGElement} from './svg.js';

export const initContext = virtual(function initContext() {
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

	let nextTextureId = 0;
	let nextElementId = 0;

	const textures = {
		EMPTY: createSVGElement('symbol', {
			id: 'tex' + nextTextureId++
		})
	};

	defs.append(textures.EMPTY);

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

	const resources = {};

	const maps = {};

	return {
		game,
		canvas,
		view,
		defs,
		background,
		tiles,
		sprites,
		resources,
		textures,
		nextTextureId,
    nextElementId,
		maps
	};
});

