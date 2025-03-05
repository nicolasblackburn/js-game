import {printError, virtual} from '../client.js';
import {createSVGElement} from './svg.js';

export const initLoader = virtual(function initLoader(ctx) {
	let nextTextureId = 0;
	let nextElementId = 0;

	ctx.resources = {};
	ctx.nextTextureId = nextTextureId;
  ctx.nextElementId = nextElementId;
  ctx.maps = {};

	ctx.textures = {
		EMPTY: createSVGElement('symbol', {
			id: 'tex' + ctx.nextTextureId++
		})
	};

	ctx.dom.defs.append(ctx.textures.EMPTY);

});

export const loadResources = virtual(async function loadResources(ctx, urls) {
	for (const url of urls) {
	  if (ctx.resources[url]) {
	    continue;
    }
		const ext = pathExtension(url);
		if (ext === 'svg') {
			await loadSVG(ctx, url);
		} else if (ext === 'json') {
			await loadJSON(ctx, url);
		}
	}
});

export const loadSVG = virtual(async function loadSVG(ctx, url) {
	const tmp = createSVGElement('svg');
	tmp.innerHTML = await (await fetch(url)).text();
	const svg = tmp.querySelector('svg');

  if (!svg) {
    return;
  }
	
	ctx.resources[url] = svg;
  svg.setAttribute('id', 'tex' + ctx.nextTextureId++); 
  ctx.dom.defs.append(svg);

  // Replace all element ids
  const subs = [];
  for (const elem of svg.querySelectorAll('[id]')) {
    const oldId = elem.id;
    const newId = 'id' + ctx.nextElementId++;
    elem.id = newId;
    subs.push([oldId, newId]);
  }

  for (const [oldId, newId] of subs) {
    for (const elem of svg.querySelectorAll(`[href="#${oldId}"]`)) {
      elem.setAttribute('href', '#' + newId);
    }

    for(const elem of svg.querySelectorAll(`[fill="url(#${oldId})"]`)) {
      elem.setAttribute('fill', `url(#${newId})`);
    }

    for(const elem of svg.querySelectorAll(`[stroke="url(#${oldId})"]`)) {
      elem.setAttribute('stroke', `url(#${newId})`);
    }
  }

  const key = pathFilename(url);
  ctx.textures[key] = svg;
});

export const loadJSON = virtual(async function loadJSON(ctx, url) {
	try {
		const data = await (await fetch(url)).json();
	  ctx.resources[url] = data;
		if (data.tiledversion) {
		  const key = pathFilename(url);
		  ctx.maps[key] = data;
    }
	} catch(e) {
	  printError(e.stack);
	}
});

export const reload = virtual(async function reload(ctx, url) {
	const extension = pathExtension(url);

	if (extension === 'svg') {
	  await reloadSVG(ctx, url);
  } else if (extension === 'json') {
    await loadJSON(ctx, url);
  }
});

const reloadSVG = virtual(async function reloadSVG(ctx, url) {
	const name = pathFilename(url);
	const tex = ctx.textures[name];
  await loadSVG(ctx, url);
	ctx.defs.removeChild(tex);
});

function pathSplit(path) {
  return (path && path.split('/') || []);
}

function pathFilename(path) {
  return pathSplit(path).slice(-1)[0].split('.')[0];
}

function pathExtension(path) {
  return pathSplit(path).slice(-1)[0].split('.').slice(1).join('.');
}

export function getTextureId(ctx, name) {
  return '#' + ctx.textures[name].getAttribute('id');
}
