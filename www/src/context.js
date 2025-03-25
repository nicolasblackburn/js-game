import {initEvents} from './events.js';
import {initLoader} from './loader.js';
import {initGamepad} from './gamepad.js';
import {createSVGElement} from './svg.js';
import {initGameState} from './gameState.js';
import {initStates} from './states.js';

export function createContext() {
  const view = {
    width: 10,
    height: 9,
    tilewidth: 16,
    tileheight: 16
  };

	const gameDiv = document.createElement('div');
	gameDiv.setAttribute('class', 'game');

	const canvasSvg = createSVGElement('svg', {
		'class': 'canvas',
		width: window.innerWidth,
		height: window.innerHeight
	});
	
	gameDiv.append(canvasSvg);

  const width = Math.min(window.innerWidth, window.innerHeight * view.width / view.height);
  const height = Math.min(window.innerHeight, window.innerWidth * view.height / view.width);
  const x = Math.max(0, (window.innerWidth - width) / 2);
  const y = Math.max(0, (window.innerHeight - height) / 2);

	const viewSvg = createSVGElement('svg', {
		'class': 'view',
		x,
		y,
		width,
		height,
		viewBox: `0 0 ${view.tilewidth * view.width} ${view.tileheight * view.height}`
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
	const horizontalTilesCount = view.width + 1;
	const verticalTilesCount = view.height + 1;
	const tilesCount = horizontalTilesCount * verticalTilesCount;

	for (let i = 0; i < tilesCount; i++) {
		const width = view.tilewidth;
		const height = view.tileheight;

		const x = (i % horizontalTilesCount) * width;
		const y = (i / horizontalTilesCount | 0) * height;
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
      width: view.tilewidth,
      height: view.tileheight,
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

	document.body.append(gameDiv);

	const ctx = {
    dom: {
      gameDiv,
      canvasSvg,
      viewSvg,
      defs,
      background,
      tiles,
      sprites
    },
    view,
    currentTime: 0,
    lastTime: 0,
    fixedTimeLeft: 0,
    fixedTimeStepDuration: 1000 / 60
  };

  initLoader(ctx);
  initEvents(ctx);
  initGamepad(ctx);

  initGameState(ctx);
  initStates(ctx);

  return ctx;
}

