import {addDirListener, addReloadListener, virtual} from './client.js';

const SVG_NS = 'http://www.w3.org/2000/svg';

const load = virtual(async function load() {
	const ctx = initContext();
	const game = initGame(ctx);

	window.addEventListener('pointercancel', event => pointerCancel(event, game, ctx));
	window.addEventListener('pointerdown', event => pointerDown(event, game, ctx));
	window.addEventListener('pointerenter', event => pointerEnter(event, game, ctx));
	window.addEventListener('pointerleave', event => pointerLeave(event, game, ctx));
	window.addEventListener('pointermove', event => pointerMove(event, game, ctx));
	window.addEventListener('pointerout', event => pointerOut(event, game, ctx));
	window.addEventListener('pointerover', event => pointerOver(event, game, ctx));
	window.addEventListener('pointerup', event => pointerUp(event, game, ctx));
	window.addEventListener('resize', event => resize(event, game, ctx));
	window.addEventListener('visibilitychange', event => visibilityChange(event, game, ctx));
	
	addReloadListener(url => reload(url, game, ctx));

	const files = await new Promise(addDirListener);
	for (const file of files) {
		const ext = pathExtension(file);
		if (ext === 'svg') {
			await loadSVG(file, game, ctx);
		} else if (ext === 'json') {
			await loadJSON(file, game, ctx);
		}
	}

	(function updateFrame () {
		update(game, ctx);
		requestAnimationFrame(updateFrame);
	})();
});

const loadSVG = virtual(async function loadSVG(url, game, ctx) {
	const tmp = createSVGElement('svg');
	tmp.innerHTML = await (await fetch(url)).text();
	const svg = tmp.querySelector('svg');
	ctx.resources[url] = svg;
  svg.setAttribute('id', 'tex' + ctx.nextTextureId++); 
  ctx.defs.append(svg);
  const key = pathFilename(url);
  ctx.textures[key] = svg;
});

const loadJSON = virtual(async function loadJSON(url, game, ctx) {
	try {
		const data = await (await fetch(url)).json();
	  ctx.resources[url] = data;
		if (data.tiledversion) {
		  const key = pathFilename(url);
		  ctx.maps[key] = data;
    }
	} catch(e) {
	}
});

const initContext = virtual(function initContext() {
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
		maps
	};
});

const initGame = virtual(function initGame(ctx) {
	return {
		state: 'load',
		map: 'map'
	};
})

const update = virtual(function update(game, ctx) {
	const {tiles, textures} = ctx;
  const map = ctx.maps[game.map];
  const mapData = map.layers[0].data;
  const tileSet = ['floor', 'block'];
  for (let i = 0; i < tiles.length; i++) {
    const tile = tiles[i];
    const x = i % (map.width + 1);
    const y = i / (map.width + 1) | 0;
    if (x >= map.width || y >= map.height) {
      tile.setAttribute('href', textures.EMPTY.getAttribute('id'));
    } else {
      const index = y * map.width + x;
      //alert(index + ' ' + mapData[index]);
      const name = tileSet[mapData[index]] ?? EMPTY;
      const id = textures[name].getAttribute('id');
      //alert(index + ' ' + id);
      tile.setAttribute('href', '#' + id);
    }
  }

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

const reload = virtual(function reload(url, game, ctx) {
	//alert("reload " + url);
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

function pathSplit(path) {
  return (path && path.split('/') || []);
}

function pathFilename(path) {
  return pathSplit(path).slice(-1)[0].split('.')[0];
}

function pathExtension(path) {
  return pathSplit(path).slice(-1)[0].split('.').slice(1).join('.');
}

window.addEventListener('load', load);

