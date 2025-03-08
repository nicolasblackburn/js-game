import {virtual} from '../client.js';
import {initEvents} from './events.js';
import {initLoader} from './loader.js';
import {initGamepad} from './gamepad.js';
import {createSVGElement} from './svg.js';
import {initGameState} from './gameState.js';

export const createContext = virtual(function createContext() {
	const gameDiv = document.createElement('div');
	gameDiv.setAttribute('class', 'game');

	const canvasSvg = createSVGElement('svg', {
		'class': 'canvas',
		width: window.innerWidth,
		height: window.innerHeight
	});
	
	gameDiv.append(canvasSvg);

	const viewSvg = createSVGElement('svg', {
		'class': 'view',
		width: window.innerWidth,
		height: window.innerWidth * 9 / 10,
		viewBox: `0 0 ${16 * 10} ${16 * 9}`
	});

	canvasSvg.append(viewSvg);

	const defs = createSVGElement('defs');
	viewSvg.append(defs);

	const background = createSVGElement('g', {
		'class': 'background'
	});
	viewSvg.append(background);

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
	viewSvg.append(spritesContainer);

	const sprites = [];
	for (let i = 0; i < 64; i++) {
		const display = i ? 'none' : '';
		const sprite = createSVGElement('use', {
      x: 0,
      y: 0,
      width: 16,
      height: 16,
			href: '#tex0'
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
	viewSvg.append(border);

	const debug = document.createElement('pre');
	Object.assign(debug.style, {
    position: 'absolute',
    top: 0,
    left: 0
	});
	gameDiv.append(debug);

	document.body.append(gameDiv);

	const ctx = {
    dom: {
      gameDiv,
      canvasSvg,
      viewSvg,
      defs,
      background,
      tiles,
      sprites,
      debug
    },
    lastTime: null,
    fixedTimeLeft: 0,
    fixedTimeStepDuration: 1000 / 60
  };

  initLoader(ctx);
  initEvents(ctx);
  initGamepad(ctx);

  initGameState(ctx);

  return ctx;
});

