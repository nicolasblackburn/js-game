import {initEvents} from './events.js';
import {initLoader} from './loader.js';
import {initGamepad} from './gamepad.js';
import {initScreens} from './screens.js';
import {
  createSVGElement, 
  setAttributes,
  setStyle
} from './svg.js';
import {initGameState} from './gameState.js';
import {initStates} from './states.js';

export function createContext() {
  /*
  const scenemodel = {
    "name": "canvas",
    "children": [
      {
        "name": "viewport",
        "width": 160,
        "height": 144,
        "children": [
          {
            "name": "tilemap"
            "tilesx": 10,
            "tilesy": 9,
            "tilewidth": 16,
            "tileheight": 16,
            "children": []
          }
        ]
      }
    ]
  };
  */
        
	const canvassvg = createSVGElement('svg', {
		'class': 'canvas',
		width: window.innerWidth,
		height: window.innerHeight
	});
	
  const view = {
    width: 10,
    height: 9,
    tilewidth: 16,
    tileheight: 16
  };

  const width = Math.min(window.innerWidth, window.innerHeight * view.width / view.height);
  const height = Math.min(window.innerHeight, window.innerWidth * view.height / view.width);
  const x = Math.max(0, (window.innerWidth - width) / 2);
  const y = Math.max(0, (window.innerHeight - height) / 2);

	const viewsvg = createSVGElement('svg', {
		'class': 'view',
		x,
		y,
		width,
		height,
		viewBox: `0 0 ${view.tilewidth * view.width} ${view.tileheight * view.height}`
	});

	canvassvg.append(viewsvg);

	const defs = createSVGElement('defs');
	viewsvg.append(defs);

	const tilemap = createSVGElement('g', {
		'class': 'tileMap'
	});
	viewsvg.append(tilemap);

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
		tilemap.append(tile);
	}

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
		viewsvg.append(sprite);
	}

	const border = createSVGElement('rect', {
		width: 16 * 10,
		height: 16 * 9,
		stroke: '#000',
		fill: 'none'
	});
	viewsvg.append(border);

  const health = createSVGElement('text', {
    x: 2,
    y: 10,
    'font-size': 8,
    'font-weight': 'bold'
  });
  health.innerHTML = 'Health: 3';
  viewsvg.append(health);

	document.body.append(canvassvg);

	const ctx = {
    dom: {
      canvassvg,
      viewsvg,
      defs,
      tilemap,
      tiles,
      sprites,
      health,
    },
    view,
    currentTime: 0,
    deltaTime: 0,
    lastTime: 0,
    fixedTimeLeft: 0,
    fixedTimeStepDuration: 1000 / 60,
    paused: false
  };

  initScreens(ctx);
  initLoader(ctx);
  initEvents(ctx);
  initGamepad(ctx);

  initGameState(ctx);
  initStates(ctx);

  return ctx;
}

